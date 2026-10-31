<?php

namespace App\Shoot;

use Illuminate\Support\Facades\DB;

/**
 * 리뉴얼 운영용(PostgreSQL). 파일 기록은 Blob 업로드 완료 알림(blob.upload-completed)이나
 * 등록하기 목록으로 shoot_files에 넣는다. 임시 서버에서는 쓰지 않는다.
 */
class DbShootStore implements ShootStore
{
    public function create(string $id, array $meta): void
    {
        DB::table('shoots')->insert([
            'id' => $id,
            'role' => $meta['role'],
            'region_sido' => $meta['region']['sido'],
            'region_gugun' => $meta['region']['gugun'] ?? null,
            'planned_photos' => $meta['planned']['photo'],
            'planned_videos' => $meta['planned']['video'],
            'client' => $meta['client'] ?? null,
            'items' => json_encode($meta['items'] ?? [], JSON_UNESCAPED_UNICODE),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function meta(string $id): ?array
    {
        $r = DB::table('shoots')->where('id', $id)->first();
        return $r ? [
            'id' => $r->id,
            'role' => $r->role,
            'region' => ['sido' => $r->region_sido, 'gugun' => $r->region_gugun],
            'planned' => ['photo' => $r->planned_photos, 'video' => $r->planned_videos],
            'client' => $r->client,
            'items' => json_decode($r->items ?? '[]', true),
            'createdAt' => (string) $r->created_at,
        ] : null;
    }

    public function files(string $id): array
    {
        return DB::table('shoot_files')->where('shoot_id', $id)->orderBy('pathname')->get()
            ->map(fn ($f) => ['pathname' => $f->pathname, 'url' => $f->url, 'size' => (int) $f->size,
                'uploadedAt' => (string) $f->uploaded_at])->all();
    }

    public function submit(string $id, array $manifest): void
    {
        DB::transaction(function () use ($id, $manifest) {
            foreach ($manifest['files'] as $f) {
                DB::table('shoot_files')->updateOrInsert(['pathname' => $f['pathname']], [
                    'shoot_id' => $id, 'kind' => $f['kind'], 'url' => $f['url'],
                    'size' => $f['size'], 'uploaded_at' => $f['uploadedAt'] ?: now(),
                ]);
            }
            DB::table('shoots')->where('id', $id)->update([
                'manifest' => json_encode($manifest, JSON_UNESCAPED_UNICODE),
                'submitted_at' => now(), 'updated_at' => now(),
            ]);
        });
    }

    public function submission(string $id): ?array
    {
        $m = DB::table('shoots')->where('id', $id)->value('manifest');
        return $m ? json_decode($m, true) : null;
    }
}
