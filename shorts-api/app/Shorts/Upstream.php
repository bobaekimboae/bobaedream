<?php

namespace App\Shorts;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * 보배드림 리뉴얼 백엔드의 숏폼 API를 부른다.
 * 원본은 한 번에 한 매물 + 앞·뒤(meta.navigation)를 주므로, 다음 매물 id를 따라가며 필요한 만큼 모은다.
 */
class Upstream
{
    /** @return array{car: array|null, next: string|null, previous: string|null} */
    public function one(string $category, ?string $publicId, ?string $bearer = null): array
    {
        $body = array_filter(['category_code' => $category, 'public_car_id' => $publicId]);
        $key = 'shorts:one:' . md5(json_encode($body));
        $fetch = function () use ($body, $bearer) {
            try {
                $req = Http::acceptJson()->asJson()->timeout(config('shorts.upstream_timeout'));
                if ($bearer) {
                    $req = $req->withToken($bearer);
                }
                $res = $req->post(config('shorts.upstream') . '/v2/cars/shorts', $body);
            } catch (ConnectionException) {
                throw new ShortsError('매물 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 502, 'upstream_unreachable');
            }
            if ($res->status() === 404) {
                return ['car' => null, 'next' => null, 'previous' => null];
            }
            if (! $res->successful()) {
                throw new ShortsError('매물 서버가 응답하지 않아요. 잠시 뒤 다시 시도해 주세요.', 502, 'upstream_error');
            }
            $nav = $res->json('meta.navigation') ?? [];
            return [
                'car' => $res->json('data.0'),
                'next' => $nav['next']['public_id'] ?? null,
                'previous' => $nav['previous']['public_id'] ?? null,
            ];
        };
        // 로그인한 사람의 응답(찜 여부 포함)은 공용으로 기억하지 않는다
        return $bearer ? $fetch() : Cache::remember($key, config('shorts.cache_ttl'), $fetch);
    }

    /**
     * $after 다음부터 $limit 개를 모은다($after 가 없으면 처음부터).
     * @return array{items: array<int, array>, next: string|null}
     */
    public function page(string $category, ?string $after, int $limit, ?string $bearer = null): array
    {
        $items = [];
        $seen = [];
        if ($after) {
            $cursor = $this->one($category, $after, $bearer)['next'];
            if (! $cursor) {
                return ['items' => [], 'next' => null];
            }
        } else {
            $cursor = null;
        }
        $first = true;
        $last = null;
        while (count($items) < $limit) {
            if (! $first && ! $cursor) {
                break;
            }
            $r = $this->one($category, $cursor, $bearer);
            $first = false;
            $car = $r['car'];
            if (! $car || isset($seen[$car['public_id']])) {
                $cursor = null;
                break;
            }
            $seen[$car['public_id']] = true;
            $last = (string) $car['public_id'];
            if ($n = Normalizer::car($car)) {
                $items[] = $n;
            }
            $cursor = $r['next'];
        }
        return ['items' => $items, 'next' => $cursor ? $last : null];
    }

    public function like(string $publicId, bool $on, string $bearer): int
    {
        try {
            $req = Http::acceptJson()->timeout(config('shorts.upstream_timeout'))->withToken($bearer);
            $url = config('shorts.upstream') . '/v2/cars/' . rawurlencode($publicId) . '/like';
            $res = $on ? $req->put($url) : $req->delete($url);
        } catch (ConnectionException) {
            throw new ShortsError('매물 서버에 연결하지 못했어요.', 502, 'upstream_unreachable');
        }
        if ($res->status() === 401) {
            throw new ShortsError('로그인하면 찜할 수 있어요.', 401, 'unauthenticated');
        }
        if (! $res->successful()) {
            throw new ShortsError('찜을 저장하지 못했어요.', 502, 'upstream_error');
        }
        return (int) ($res->json('data.like_count') ?? $res->json('like_count') ?? -1);
    }
}
