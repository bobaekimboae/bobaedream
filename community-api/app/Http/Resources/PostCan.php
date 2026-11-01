<?php

namespace App\Http\Resources;

use App\Models\Post;
use Illuminate\Http\Request;

/** PostResource.can — 서버 정책 결과. 화면은 mine 대신 이 값을 본다(mine 은 이전 화면과의 호환용). */
trait PostCan
{
    protected function can(Request $request, Post $post): array
    {
        $u = $request->user();
        return [
            'update' => (bool) $u?->can('update', $post),
            'delete' => (bool) $u?->can('delete', $post),
            'report' => (bool) $u?->can('report', $post),
        ];
    }

    protected function common(Request $request, Post $post): array
    {
        $v = $post->vehicle;
        return [
            'id' => (string) $post->id,
            'modelId' => $v->id,
            'brand' => $v->brand,
            'model' => $v->model,
            'trim' => $v->trim,
            'brandLogo' => $v->brand_logo,
            'title' => $post->title,
            'body' => $post->body,
            'author' => $post->author->nickname,
            'avatar' => $post->author->avatar,
            'publishedAt' => $post->created_at->toIso8601String(),
            'images' => $post->images ?? [],
            'views' => $post->views,
            'comments' => $post->comments,
            'likes' => $post->likes,
            'commentList' => CommentResource::collection($post->relationLoaded('commentList') ? $post->commentList->take(3) : collect())->resolve($request),
            'mine' => $request->user()?->id === $post->user_id,
            'can' => $this->can($request, $post),
        ];
    }
}
