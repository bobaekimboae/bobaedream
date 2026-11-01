<?php

namespace App\Http\Resources;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** GET /api/community/me — 로그인하지 않았으면 id null · 권한 모두 false */
class MeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $u = $this->resource;
        $active = (bool) $u?->isActive();
        return [
            'id' => $u?->id,
            'nickname' => $u?->nickname ?? '',
            'avatar' => $u?->avatar ?? '',
            'can' => ['post' => (bool) $u?->can('create', Post::class), 'comment' => $active, 'react' => $active],
        ];
    }
}
