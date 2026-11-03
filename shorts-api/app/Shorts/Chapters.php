<?php

namespace App\Shorts;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/** 비디오 투어 부위 시각. 원본 백엔드에 없는 정보라 이 모듈이 PostgreSQL에 따로 둔다. */
class Chapters
{
    private ?bool $ready = null;

    private function ready(): bool
    {
        if ($this->ready === null) {
            try {
                $this->ready = Schema::hasTable('short_video_chapters');
            } catch (\Throwable) {
                $this->ready = false;
            }
        }
        return $this->ready;
    }

    /** @param array<int,string> $ids @return array<string, array<int,array>> */
    public function forCars(array $ids): array
    {
        if (! $ids || ! $this->ready()) {
            return [];
        }
        $out = [];
        foreach (DB::table('short_video_chapters')->whereIn('car_public_id', $ids)->orderBy('sort')->get() as $r) {
            $out[$r->car_public_id][] = ['key' => $r->chapter_key, 'from' => (float) $r->from_sec, 'to' => (float) $r->to_sec];
        }
        return $out;
    }

    /** @param array<int,array{key:string,from:float|int,to:float|int}> $chapters */
    public function replace(string $carId, string $videoUrl, array $chapters): void
    {
        if (! $this->ready()) {
            throw new ShortsError('부위 저장소가 준비되지 않았어요.', 503, 'storage_unavailable');
        }
        DB::transaction(function () use ($carId, $videoUrl, $chapters) {
            DB::table('short_video_chapters')->where('car_public_id', $carId)->delete();
            $now = now();
            foreach (array_values($chapters) as $i => $c) {
                DB::table('short_video_chapters')->insert([
                    'car_public_id' => $carId, 'video_url' => $videoUrl, 'chapter_key' => $c['key'],
                    'from_sec' => $c['from'], 'to_sec' => $c['to'], 'sort' => $i,
                    'created_at' => $now, 'updated_at' => $now,
                ]);
            }
        });
    }

    public function view(string $carId, string $viewer, float $watched): bool
    {
        if (! $this->ready()) {
            return false;
        }
        $since = now()->subSeconds(config('shorts.view_window'));
        $dup = DB::table('short_video_views')->where('car_public_id', $carId)->where('viewer_hash', $viewer)
            ->where('created_at', '>=', $since)->first();
        if ($dup) {
            if ($watched > (float) $dup->watched_sec) {
                DB::table('short_video_views')->where('id', $dup->id)->update(['watched_sec' => $watched, 'updated_at' => now()]);
            }
            return false;
        }
        DB::table('short_video_views')->insert([
            'car_public_id' => $carId, 'viewer_hash' => $viewer, 'watched_sec' => $watched,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return true;
    }
}
