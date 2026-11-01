<?php

namespace App\Http\Controllers;

use App\Community\Board;
use App\Models\Post;
use App\Models\Reaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * PUT · DELETE /api/community/{board}/posts/{post}/reactions/{kind}
 * 공감과 비공감은 한쪽만(공감을 누르면 비공감이 풀림). 즐겨찾기는 따로. 같은 요청을 두 번 보내도 결과가 같다.
 */
class ReactionController
{
    public function update(Request $request, Board $board, Post $post, string $kind)
    {
        return $this->apply($request, $board, $post, $kind, true);
    }

    public function destroy(Request $request, Board $board, Post $post, string $kind)
    {
        return $this->apply($request, $board, $post, $kind, false);
    }

    private function apply(Request $request, Board $board, Post $post, string $kind, bool $on)
    {
        abort_unless($post->board === $board && in_array($kind, ['like', 'dislike', 'bookmark'], true), 404);
        if ($kind === 'dislike' && $board !== Board::Review) abort(404); // 비공감은 리뷰 게시판에만
        Gate::authorize('react', $post);
        $uid = $request->user()->id;
        DB::transaction(function () use ($post, $kind, $on, $uid) {
            $kinds = $on && $kind !== 'bookmark' ? ['like', 'dislike'] : [$kind];
            Reaction::where('post_id', $post->id)->where('user_id', $uid)->whereIn('kind', $kinds)->delete();
            if ($on) Reaction::create(['post_id' => $post->id, 'user_id' => $uid, 'kind' => $kind]);
            $count = fn ($k) => Reaction::where('post_id', $post->id)->where('kind', $k)->count();
            $post->forceFill(['likes' => $count('like'), 'dislikes' => $count('dislike')])->saveQuietly();
        });
        return response()->noContent();
    }
}
