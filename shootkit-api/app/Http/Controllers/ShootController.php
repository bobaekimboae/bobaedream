<?php

namespace App\Http\Controllers;

use App\Shoot\BlobClient;
use App\Shoot\ShootError;
use App\Shoot\ShootStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * 촬영 키트 업로드 API.
 * 큰 파일은 서버를 거치지 않는다: 폰 → Vercel Blob 직접 업로드, 서버는 허가표와 기록만.
 */
class ShootController
{
    private const ID = '[0-9a-z]{26}';
    private const EXT = ['photo' => ['jpg', 'jpeg', 'png', 'webp'], 'video' => ['mp4', 'webm', 'mov']];

    public function __construct(private ShootStore $store)
    {
    }

    public function health(): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'service' => 'shootkit-api',
            'php' => PHP_VERSION,
            'laravel' => app()->version(),
            'store' => config('shoot.store'),
            'storage' => app(BlobClient::class)->configured(),
        ]);
    }

    /** 촬영 한 건을 만든다. 등록하기를 누른 순간 한 번. */
    public function create(Request $r): JsonResponse
    {
        $v = $r->validate([
            'role' => 'required|in:dealer,crew',
            'region.sido' => 'required|string|max:16',
            'region.gugun' => 'nullable|string|max:32',
            'planned.photo' => 'required|integer|min:0|max:' . config('shoot.limits.photo.count'),
            'planned.video' => 'required|integer|min:0|max:' . config('shoot.limits.video.count'),
            'client' => 'nullable|string|max:32',
            // 칸 이름표(파일 번호 → 「좌측 전면 45°」 · 「외관」). 보기 화면에서 쓴다
            'items' => 'nullable|array|max:80',
            'items.*.n' => 'required_with:items|integer|min:1|max:99',
            'items.*.kind' => 'required_with:items|in:photo,video',
            'items.*.label' => 'required_with:items|string|max:40',
        ]);
        if ($v['planned']['photo'] + $v['planned']['video'] < 1) {
            throw new ShootError('올릴 사진이나 영상이 없어요.');
        }
        $id = strtolower((string) Str::ulid());
        $meta = $v + ['id' => $id, 'createdAt' => now()->toIso8601String()];
        $this->store->create($id, $meta);
        return response()->json(['ok' => true, 'id' => $id, 'limits' => config('shoot.limits')], 201);
    }

    /**
     * @vercel/blob/client upload()가 부르는 곳.
     * blob.generate-client-token → 이 촬영의 경로 · 종류 · 크기만 허락하는 허가표를 준다.
     */
    public function blob(Request $r, BlobClient $blob): JsonResponse
    {
        $type = $r->input('type');
        if ($type === 'blob.upload-completed') {
            return response()->json(['type' => $type, 'response' => 'ok']);
        }
        if ($type !== 'blob.generate-client-token') {
            throw new ShootError('알 수 없는 요청이에요.', 400, 'bad_type');
        }
        $pathname = (string) $r->input('payload.pathname', '');
        if (!preg_match('#^shoots/(' . self::ID . ')/(photo|video)/(\d{2})-([a-z0-9-]{1,40})\.([a-z0-9]{2,4})$#', $pathname, $m)) {
            throw new ShootError('올릴 파일 이름이 올바르지 않아요.', 400, 'bad_path');
        }
        [, $id, $kind, , , $ext] = $m;
        if (!in_array($ext, self::EXT[$kind], true)) {
            throw new ShootError('이 파일 형식은 올릴 수 없어요.', 400, 'bad_ext');
        }
        if (!$this->store->meta($id)) {
            throw new ShootError('촬영 기록을 찾지 못했어요. 처음부터 다시 등록해 주세요.', 404, 'no_shoot');
        }
        if ($this->store->submission($id)) {
            throw new ShootError('이미 등록을 마친 촬영이에요.', 409, 'submitted');
        }
        $limit = config("shoot.limits.$kind");
        $have = count(array_filter($this->store->files($id), fn ($f) => str_contains($f['pathname'], "/$kind/")));
        if ($have >= $limit['count']) {
            throw new ShootError('올릴 수 있는 개수를 넘었어요.', 409, 'too_many');
        }
        $token = $blob->clientToken([
            'pathname' => $pathname,
            'allowedContentTypes' => $limit['types'],
            'maximumSizeInBytes' => $limit['bytes'],
            'addRandomSuffix' => true,
            'validUntil' => (int) round(microtime(true) * 1000) + config('shoot.token_ttl') * 1000,
        ]);
        return response()->json(['type' => $type, 'clientToken' => $token]);
    }

    /** 등록하기 마무리: 폰이 올렸다고 말한 파일이 저장소에 다 있는지 맞춰 본다. */
    public function submit(Request $r, string $id): JsonResponse
    {
        $this->assertId($id);
        $meta = $this->store->meta($id) ?? throw new ShootError('촬영 기록을 찾지 못했어요.', 404, 'no_shoot');
        if ($done = $this->store->submission($id)) {
            return response()->json(['ok' => true, 'already' => true] + $this->view($id, $meta, $done));
        }
        $r->validate(['files' => 'required|array|min:1|max:80', 'files.*' => 'required|string|max:200']);
        $have = collect($this->store->files($id))->keyBy('pathname');
        $missing = array_values(array_filter($r->input('files'), fn ($p) => !$have->has($p)));
        if ($missing) {
            return response()->json(['ok' => false, 'code' => 'missing', 'missing' => $missing,
                'error' => count($missing) . '개 파일이 아직 저장되지 않았어요. 다시 올려 주세요.'], 409);
        }
        $files = $have->only($r->input('files'))->values()->map(fn ($f) => $f + [
            'kind' => str_contains($f['pathname'], '/video/') ? 'video' : 'photo',
        ])->all();
        $manifest = ['submittedAt' => now()->toIso8601String(), 'files' => $files];
        $this->store->submit($id, $manifest);
        return response()->json(['ok' => true] + $this->view($id, $meta, $manifest));
    }

    public function show(string $id): JsonResponse
    {
        $this->assertId($id);
        $meta = $this->store->meta($id) ?? throw new ShootError('촬영 기록을 찾지 못했어요.', 404, 'no_shoot');
        return response()->json(['ok' => true] + $this->view($id, $meta, $this->store->submission($id)));
    }

    private function view(string $id, array $meta, ?array $manifest): array
    {
        $files = $manifest['files'] ?? array_map(fn ($f) => $f + [
            'kind' => str_contains($f['pathname'], '/video/') ? 'video' : 'photo',
        ], $this->store->files($id));
        return [
            'id' => $id,
            'status' => $manifest ? 'submitted' : 'uploading',
            'role' => $meta['role'],
            'region' => $meta['region'],
            'createdAt' => $meta['createdAt'] ?? null,
            'items' => $meta['items'] ?? [],
            'submittedAt' => $manifest['submittedAt'] ?? null,
            'photos' => array_values(array_filter($files, fn ($f) => $f['kind'] === 'photo')),
            'videos' => array_values(array_filter($files, fn ($f) => $f['kind'] === 'video')),
        ];
    }

    private function assertId(string $id): void
    {
        if (!preg_match('#^' . self::ID . '$#', $id)) {
            throw new ShootError('촬영 번호가 올바르지 않아요.', 404, 'bad_id');
        }
    }
}
