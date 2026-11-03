<?php

namespace App\Http\Controllers;

use App\Community\Board;
use App\Community\CommunityError;
use App\Http\Requests\StorePublishRequest;
use App\Http\Resources\PublishResource;
use App\Models\Draft;
use App\Models\Post;
use App\Models\Upload;
use App\Models\VehicleModel;
use App\Models\VoteBallot;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/** 동처띠 글쓰기 키트 6개 종류의 등록 · 투표. 목록 · 상세 · 삭제 · 댓글 · 반응 · 임시저장은 리뷰 · 연비와 같은 경로를 쓴다. */
class PublishController
{
    /** POST /api/community/{board}/posts (board = dynamic · ask · video · long · sell · price) */
    public function store(StorePublishRequest $request, Board $board): PublishResource
    {
        abort_unless($board->isPublisher(), 404);
        $in = $request->validated();
        $uid = $request->user()->id;
        $vehicle = isset($in['model_id']) ? VehicleModel::find($in['model_id']) : null;
        $post = DB::transaction(function () use ($in, $board, $uid, $vehicle) {
            $ids = $in['media'] ?? [];
            $uploads = Upload::whereIn('id', $ids)->lockForUpdate()->get()->keyBy('id');
            if ($uploads->whereNotNull('post_id')->isNotEmpty()) throw new CommunityError('이미 다른 글에 쓴 파일이에요.', 'invalid', 422, ['media']);
            $title = $in['title'] ?? match ($board) {
                Board::Sell => "{$vehicle->brand} {$vehicle->model} 팝니다",
                Board::Price => "{$vehicle->brand} {$vehicle->model} 실제 구매가",
                default => '',
            };
            $attach = array_filter(['owner_price' => $in['owner_price'] ?? null, 'parts' => $in['parts'] ?? null]);
            $post = Post::create([
                'board' => $board, 'user_id' => $uid, 'model_id' => $vehicle?->id, 'title' => $title, 'body' => $in['body'] ?? '',
                'images' => [], 'media' => array_map(fn ($id) => $uploads[$id]->toMedia(), $ids),
                'topic' => $in['topic'] ?? null, 'circle' => $in['circle'] ?? null, 'claim' => $in['claim'] ?? null,
                'city' => $in['city'] ?? ($in['price']['city'] ?? null), 'attach' => $attach ?: null,
            ]);
            Upload::whereIn('id', $ids)->update(['post_id' => $post->id]);
            if ($board === Board::Sell) $post->sell()->create($in['sell']);
            if ($board === Board::Price) {
                $post->price()->create($in['price']);
                if (! empty($in['price']['receipt_upload_id'])) Upload::whereKey($in['price']['receipt_upload_id'])->update(['post_id' => $post->id]);
            }
            if (! empty($in['vote'])) {
                $post->vote()->create(['title' => $in['vote']['title'], 'multi' => (bool) ($in['vote']['multi'] ?? false), 'options' => array_values($in['vote']['options']), 'ends_at' => now()->addDays((int) $in['vote']['ends_in_days'])]);
            }
            Draft::where('user_id', $uid)->where('board', $board->value)->delete();
            return $post;
        });
        return new PublishResource($post->load(PostController::relations($board)));
    }

    /** PUT /api/community/{board}/posts/{post}/vote { choices:[0,2] } — 한 사람 한 번(다시 보내면 바꾼다). 마감 뒤에는 막는다. */
    public function vote(Request $request, Board $board, Post $post): JsonResponse
    {
        abort_unless($post->board === $board, 404);
        $vote = $post->vote ?? abort(404);
        Gate::authorize('react', $post);
        if ($vote->ends_at->isPast()) throw new CommunityError('마감된 투표예요.', 'closed', 409);
        $n = count($vote->options);
        $in = $request->validate(['choices' => ['required', 'array', 'min:1', 'max:' . ($vote->multi ? $n : 1)], 'choices.*' => ['integer', 'between:0,' . ($n - 1), 'distinct']]);
        VoteBallot::updateOrCreate(['post_id' => $post->id, 'user_id' => $request->user()->id], ['choices' => array_values($in['choices'])]);
        return response()->json(['data' => (new PublishResource($post->load(PostController::relations($board))))->resolve($request)['vote']]);
    }
}
