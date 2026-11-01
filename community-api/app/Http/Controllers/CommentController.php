<?php

namespace App\Http\Controllers;

use App\Community\Board;
use App\Community\CommunityError;
use App\Http\Requests\StoreCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class CommentController
{
    public function store(StoreCommentRequest $request, Board $board, Post $post): CommentResource
    {
        abort_unless($post->board === $board, 404);
        Gate::authorize('comment', $post);
        $parent = $request->integer('parent_id') ?: null;
        if ($parent && ! Comment::where('id', $parent)->where('post_id', $post->id)->exists()) {
            throw new CommunityError('답글을 달 댓글이 없어요.', 'invalid', 422, ['parent_id']);
        }
        $comment = DB::transaction(function () use ($request, $post, $parent) {
            $c = $post->commentList()->create(['user_id' => $request->user()->id, 'parent_id' => $parent, 'body' => $request->validated('body')]);
            $post->increment('comments');
            return $c;
        });
        return new CommentResource($comment->load('author')->loadCount('replies'));
    }

    public function destroy(Request $request, Board $board, Post $post, Comment $comment)
    {
        abort_unless($post->board === $board && $comment->post_id === $post->id, 404);
        Gate::authorize('delete', $comment);
        DB::transaction(function () use ($post, $comment) {
            $comment->delete();
            $post->decrement('comments');
        });
        return response()->noContent();
    }
}
