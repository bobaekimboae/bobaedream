<?php

namespace App\Community;

use App\Models\Comment;
use App\Models\Post;
use App\Policies\CommentPolicy;
use App\Policies\PostPolicy;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class CommunityServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Gate::policy(Post::class, PostPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        // 글 · 댓글 쓰기: 한 사람 1분에 글 3건 · 댓글 10건(도배 막기). 임시저장은 자동 저장이라 넉넉히.
        RateLimiter::for('community-post', fn (Request $r) => Limit::perMinute(3)->by($r->user()?->id ?: $r->ip()));
        RateLimiter::for('community-comment', fn (Request $r) => Limit::perMinute(10)->by($r->user()?->id ?: $r->ip()));
        RateLimiter::for('community-draft', fn (Request $r) => Limit::perMinute(60)->by($r->user()?->id ?: $r->ip()));
    }
}
