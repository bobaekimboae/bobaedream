<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** 화면 lib/data.ts 의 Comment 모양 */
class CommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => (string) $this->id,
            'author' => $this->author->nickname,
            'avatar' => $this->author->avatar,
            'body' => $this->body,
            'likes' => $this->likes,
            'region' => $this->region,
            'daysAgo' => (int) $this->created_at->startOfDay()->diffInDays(now()->startOfDay()),
            'replies' => (int) ($this->replies_count ?? 0),
            'can' => ['delete' => (bool) $request->user()?->can('delete', $this->resource)],
        ];
    }
}
