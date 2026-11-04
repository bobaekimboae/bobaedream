<?php

namespace App\Http\Controllers;

use App\Community\CommunityError;
use App\Models\Post;
use App\Models\Upload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * POST /api/community/uploads (multipart) — 글쓰기 키트의 사진 · 영상을 먼저 올리고, 등록할 때 upload_id 로 붙인다.
 * 사진은 서버에서 다시 저장해 위치(GPS) 같은 촬영 정보를 지운다(회전 방향만 반영). 영상은 그대로 두고 표지(cover)를 따로 받는다.
 * 영수증(purpose=receipt)은 공개 주소 없이 비공개 저장소에 둔다(구매가 심사용).
 */
class UploadController
{
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Post::class);
        $c = config('community.uploads');
        $request->validate([
            'file' => ['required', 'file', 'mimetypes:' . implode(',', [...$c['image_mimes'], ...$c['video_mimes']])],
            'purpose' => ['nullable', 'in:post,receipt'],
            'cover' => ['nullable', 'file', 'mimetypes:' . implode(',', $c['image_mimes']), 'max:' . $c['image_max_kb']],
            'duration' => ['nullable', 'numeric', 'between:0.5,' . $c['video_max_sec']],
        ]);
        /** @var UploadedFile $file */
        $file = $request->file('file');
        $mime = (string) $file->getMimeType();
        $isVideo = in_array($mime, $c['video_mimes'], true);
        $purpose = $request->input('purpose', 'post');
        if ($isVideo && $purpose === 'receipt') throw new CommunityError('영수증은 사진으로 올려 주세요.', 'invalid', 422, ['file']);
        $maxKb = $isVideo ? $c['video_max_kb'] : $c['image_max_kb'];
        if ($file->getSize() > $maxKb * 1024) {
            throw new CommunityError($isVideo ? '영상은 ' . intdiv($maxKb, 1024) . 'MB까지 올릴 수 있어요.' : '사진은 ' . intdiv($maxKb, 1024) . 'MB까지 올릴 수 있어요.', 'too_large', 422, ['file']);
        }
        $recent = Upload::where('user_id', $request->user()->id)->where('created_at', '>=', now()->subDay())->count();
        if ($recent >= $c['daily_limit']) throw new CommunityError('오늘 올릴 수 있는 파일 수를 넘었어요.', 'too_many', 429);

        $id = (string) Str::uuid();
        $disk = $purpose === 'receipt' ? 'local' : 'public';
        $dir = 'community/' . now()->format('Y/m');
        if ($isVideo) {
            $ext = ['video/mp4' => 'mp4', 'video/quicktime' => 'mov', 'video/webm' => 'webm'][$mime] ?? 'mp4';
            $path = $file->storeAs($dir, "$id.$ext", $disk);
            [$w, $h] = [null, null];
        } else {
            [$path, $w, $h, $mime] = $this->storeImage($file, $disk, $dir, $id);
        }
        $coverPath = null;
        if ($isVideo && $request->hasFile('cover')) {
            [$coverPath, $w, $h] = $this->storeImage($request->file('cover'), $disk, $dir, "$id-cover");
        }
        $u = Upload::create([
            'id' => $id, 'user_id' => $request->user()->id, 'kind' => $isVideo ? 'video' : 'image', 'purpose' => $purpose, 'disk' => $disk,
            'path' => $path, 'cover_path' => $coverPath, 'mime' => $mime, 'bytes' => Storage::disk($disk)->size($path),
            'width' => $w, 'height' => $h, 'duration_ms' => $request->filled('duration') ? (int) round($request->float('duration') * 1000) : null,
        ]);
        return response()->json(['data' => ['id' => $u->id] + $u->toMedia()], 201);
    }

    /** 사진을 다시 저장한다(촬영 정보 제거 · 회전 반영 · 긴 변 최대 길이). GD 로 못 여는 형식(HEIC)은 그대로 둔다. */
    private function storeImage(UploadedFile $file, string $disk, string $dir, string $name): array
    {
        $mime = (string) $file->getMimeType();
        $src = @imagecreatefromstring((string) file_get_contents($file->getRealPath()));
        if ($src === false) {
            $path = $file->storeAs($dir, $name . '.' . ($file->extension() ?: 'bin'), $disk);
            $size = @getimagesize($file->getRealPath()) ?: [null, null];
            return [$path, $size[0], $size[1], $mime];
        }
        if ($mime === 'image/jpeg' && function_exists('exif_read_data')) {
            $o = (int) (@exif_read_data($file->getRealPath())['Orientation'] ?? 1);
            $src = match ($o) { 3 => imagerotate($src, 180, 0), 6 => imagerotate($src, -90, 0), 8 => imagerotate($src, 90, 0), default => $src };
        }
        $max = config('community.uploads.image_long_edge');
        [$w, $h] = [imagesx($src), imagesy($src)];
        if (max($w, $h) > $max) {
            $r = $max / max($w, $h);
            $src = imagescale($src, (int) round($w * $r), (int) round($h * $r));
            [$w, $h] = [imagesx($src), imagesy($src)];
        }
        $png = $mime === 'image/png';
        if ($png) imagesavealpha($src, true);
        ob_start();
        $png ? imagepng($src, null, 6) : imagejpeg($src, null, 86);
        $bytes = (string) ob_get_clean();
        $path = "$dir/$name." . ($png ? 'png' : 'jpg');
        Storage::disk($disk)->put($path, $bytes);
        return [$path, $w, $h, $png ? 'image/png' : 'image/jpeg'];
    }
}
