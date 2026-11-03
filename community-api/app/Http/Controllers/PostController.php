<?php

namespace App\Http\Controllers;

use App\Community\Board;
use App\Community\RatingRules;
use App\Http\Requests\StoreFuelRequest;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\FuelResource;
use App\Http\Resources\PublishResource;
use App\Http\Resources\ReviewResource;
use App\Models\Draft;
use App\Models\Post;
use App\Models\VehicleModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class PostController
{
    /**
     * GET /api/community/{board}/posts?model_id=&sort=latest|likes|comments&owner=1&cursor=
     * 화면은 json.data 만 읽고, 다음 쪽은 meta.next_cursor 로 이어 받는다.
     */
    public function index(Request $request, Board $board): JsonResponse
    {
        $viewer = $request->user('sanctum'); // 읽기는 로그인 없이도 되고, 로그인했으면 can · mine 을 그 사람 기준으로 계산
        $request->setUserResolver(fn () => $viewer);
        $q = Post::query()->where('board', $board)->where('status', 'published')
            ->with(self::relations($board))
            ->when($request->boolean('mine') && $viewer, fn ($q) => $q->where('user_id', $viewer->id))
            ->when($request->string('model_id')->isNotEmpty(), fn ($q) => $q->where('model_id', $request->string('model_id')))
            ->when($board === Board::Review && $request->boolean('owner'), fn ($q) => $q->whereHas('review', fn ($r) => $r->where('owner', true)));
        $total = (clone $q)->count();
        $sort = match ($request->string('sort')->toString()) { 'likes' => 'likes', 'comments' => 'comments', default => 'created_at' };
        $page = $q->orderByDesc($sort)->orderByDesc('id')->cursorPaginate(config('community.page_size'));
        return response()->json([
            'data' => self::resource($board)::collection($page->getCollection())->resolve($request),
            'meta' => ['next_cursor' => $page->nextCursor()?->encode(), 'total' => $total],
        ]);
    }

    /** 게시판마다 함께 불러올 관계(목록 · 상세 · 등록 응답이 같은 모양이 되게) */
    public static function relations(Board $board): array
    {
        $detail = match ($board) {
            Board::Review => ['review'], Board::Fuel => ['fuel'], Board::Sell => ['sell'], Board::Price => ['price'],
            Board::Dynamic, Board::Ask => ['vote.ballots'], default => [],
        };
        return ['author', 'vehicle', ...$detail, 'commentList' => fn ($c) => $c->with('author')->withCount('replies')];
    }

    /** @return class-string<\Illuminate\Http\Resources\Json\JsonResource> */
    public static function resource(Board $board): string
    {
        return match ($board) { Board::Review => ReviewResource::class, Board::Fuel => FuelResource::class, default => PublishResource::class };
    }

    /** GET /api/community/{board}/posts/{post} — 한 건(상세 화면). 볼 때마다 조회 수 +1(같은 요청 묶음 방지는 앞단 캐시가 맡는다) */
    public function show(Request $request, Board $board, Post $post): JsonResponse
    {
        abort_unless($post->board === $board && $post->status === 'published', 404);
        $viewer = $request->user('sanctum');
        $request->setUserResolver(fn () => $viewer);
        $post->increment('views');
        $res = self::resource($board);
        return response()->json(['data' => (new $res($post->load(self::relations($board))))->resolve($request)]);
    }

    /** POST /api/community/review/posts — 등록하면 같은 게시판 임시저장을 지운다 */
    public function storeReview(StoreReviewRequest $request): ReviewResource
    {
        $in = $request->validated();
        $vehicle = VehicleModel::findOrFail($in['model_id']);
        $post = DB::transaction(function () use ($request, $in, $vehicle) {
            $post = Post::create([
                'board' => Board::Review, 'user_id' => $request->user()->id, 'model_id' => $vehicle->id,
                'title' => "{$vehicle->brand} {$vehicle->model} 리뷰", 'body' => $in['body'], 'images' => [],
            ]);
            $p = $in['owner'] ? $in['purchase'] : null;
            $post->review()->create([
                'owner' => $in['owner'], 'ratings' => $in['ratings'], 'rating' => RatingRules::average($in['ratings']),
                'purchase_month' => $p['month'] ?? null, 'purchase_city' => $p['city'] ?? null, 'purchase_price' => $p['price'] ?? null,
                'purchase_paid' => $p['paid'] ?? null, 'purchase_metric' => $p['metric'] ?? null,
            ]);
            Draft::where('user_id', $request->user()->id)->where('board', 'review')->delete();
            return $post;
        });
        return new ReviewResource($post->load(['author', 'vehicle', 'review']));
    }

    /** POST /api/community/fuel/posts */
    public function storeFuel(StoreFuelRequest $request): FuelResource
    {
        $in = $request->validated();
        $vehicle = VehicleModel::findOrFail($in['model_id']);
        $post = DB::transaction(function () use ($request, $in, $vehicle) {
            $post = Post::create([
                'board' => Board::Fuel, 'user_id' => $request->user()->id, 'model_id' => $vehicle->id,
                'title' => $in['title'] ?? "{$vehicle->model} 연비·전비 공유", 'body' => $in['body'], 'images' => [],
            ]);
            $post->fuel()->create([
                'city' => $in['city'], 'odometer_km' => $in['odometer_km'] ?? null, 'fuel_km_per_l' => $in['fuel_km_per_l'] ?? null,
                'energy_km_per_kwh' => $in['energy_km_per_kwh'] ?? null, 'full_charge_km' => $in['full_charge_km'] ?? null,
                'temperature_c' => $in['temperature_c'] ?? null,
            ]);
            Draft::where('user_id', $request->user()->id)->where('board', 'fuel')->delete();
            return $post;
        });
        return new FuelResource($post->load(['author', 'vehicle', 'fuel']));
    }

    /** DELETE /api/community/{board}/posts/{post} — 지운 글은 목록에서 빠지고 복구용으로 남긴다(soft delete) */
    public function destroy(Request $request, Board $board, Post $post)
    {
        abort_unless($post->board === $board, 404);
        Gate::authorize('delete', $post);
        $post->update(['status' => 'deleted']);
        $post->delete();
        return response()->noContent();
    }
}
