<?php

namespace App\Http\Controllers;

use App\Shorts\Chapters;
use App\Shorts\Normalizer;
use App\Shorts\ShortsError;
use App\Shorts\Upstream;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class ShortsController
{
    private const CATEGORIES = ['cars', 'trucks', 'bikes', 'campers', 'machinery', 'parts'];
    private const ID = '/^[A-Za-z0-9]{4,32}$/';

    public function __construct(private Upstream $up, private Chapters $chapters) {}

    public function health(): JsonResponse
    {
        return response()->json(['ok' => true, 'upstream' => config('shorts.upstream')]);
    }

    /** GET /api/shorts?category=cars&after=<public_id>&limit=8 */
    public function index(Request $r): JsonResponse
    {
        $v = $r->validate([
            'category' => 'nullable|in:' . implode(',', self::CATEGORIES),
            'after' => ['nullable', 'regex:' . self::ID],
            'limit' => 'nullable|integer|min:1|max:' . config('shorts.max_page_size'),
        ]);
        $page = $this->up->page($v['category'] ?? 'cars', $v['after'] ?? null,
            (int) ($v['limit'] ?? config('shorts.page_size')), $r->bearerToken());
        return response()->json(['ok' => true, 'data' => $this->withChapters($page['items']), 'next' => $page['next']]);
    }

    /** GET /api/shorts/{id} */
    public function show(Request $r, string $id): JsonResponse
    {
        $this->id($id);
        $one = $this->up->one($r->query('category', 'cars'), $id, $r->bearerToken());
        $car = $one['car'] && $one['car']['public_id'] === $id ? Normalizer::car($one['car']) : null;
        if (! $car) {
            throw new ShortsError('이 매물의 숏폼을 찾을 수 없어요. 판매가 끝났을 수 있어요.', 404, 'not_found');
        }
        return response()->json(['ok' => true, 'data' => $this->withChapters([$car])[0], 'next' => $one['next'], 'previous' => $one['previous']]);
    }

    /** PUT|DELETE /api/shorts/{id}/like — 로그인 토큰을 원본 백엔드로 그대로 넘긴다 */
    public function like(Request $r, string $id): JsonResponse
    {
        $this->id($id);
        $token = $r->bearerToken();
        if (! $token) {
            throw new ShortsError('로그인하면 찜할 수 있어요.', 401, 'unauthenticated');
        }
        $count = $this->up->like($id, $r->isMethod('PUT'), $token);
        return response()->json(['ok' => true, 'liked' => $r->isMethod('PUT'), 'likes' => $count >= 0 ? $count : null]);
    }

    /** POST /api/shorts/{id}/views {watched: 초} — 2초 넘게 본 시청만 센다 */
    public function view(Request $r, string $id): JsonResponse
    {
        $this->id($id);
        $v = $r->validate(['watched' => 'required|numeric|min:0|max:3600']);
        $viewer = hash('sha256', ($r->bearerToken() ?: $r->ip()) . '|' . $r->userAgent());
        $key = 'shorts-view:' . $viewer;
        if (RateLimiter::tooManyAttempts($key, 120)) {
            throw new ShortsError('잠시 뒤 다시 시도해 주세요.', 429, 'rate_limited');
        }
        RateLimiter::hit($key, 60);
        $counted = $v['watched'] >= 2 && $this->chapters->view($id, $viewer, (float) $v['watched']);
        return response()->json(['ok' => true, 'counted' => $counted]);
    }

    /** PUT /api/shorts/{id}/chapters {video_url, chapters:[{key,from,to}]} — 관리자 토큰 필요 */
    public function chapters(Request $r, string $id): JsonResponse
    {
        $this->id($id);
        $admin = (string) config('shorts.admin_token');
        if ($admin === '' || ! hash_equals($admin, (string) $r->header('X-Shorts-Admin'))) {
            throw new ShortsError('부위를 저장할 권한이 없어요.', 403, 'forbidden');
        }
        $v = $r->validate([
            'video_url' => 'required|url|max:512',
            'chapters' => 'present|array|max:12',
            'chapters.*.key' => 'required|in:' . implode(',', config('shorts.chapter_keys')),
            'chapters.*.from' => 'required|numeric|min:0',
            'chapters.*.to' => 'required|numeric|gt:chapters.*.from',
        ]);
        $prev = -1;
        foreach ($v['chapters'] as $i => $c) {
            if ($c['from'] < $prev) {
                throw new ShortsError('부위 시각이 겹치거나 순서가 바뀌었어요.', 422, 'invalid');
            }
            $prev = $c['to'];
        }
        $this->chapters->replace($id, $v['video_url'], $v['chapters']);
        return response()->json(['ok' => true, 'chapters' => array_values($v['chapters'])]);
    }

    private function id(string $id): void
    {
        if (! preg_match(self::ID, $id)) {
            throw new ShortsError('매물 번호가 올바르지 않아요.', 422, 'invalid');
        }
    }

    /** @param array<int,array> $items */
    private function withChapters(array $items): array
    {
        $map = $this->chapters->forCars(array_column($items, 'id'));
        foreach ($items as &$it) {
            $it['chapters'] = $map[$it['id']] ?? [];
        }
        return $items;
    }
}
