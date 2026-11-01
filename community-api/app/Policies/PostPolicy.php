<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;

/** 글 권한. 결과는 PostResource.can 으로 화면에 내려가며, 화면은 이 값으로만 수정 · 삭제 · 신고 버튼을 보인다. */
class PostPolicy
{
    public function create(User $user): bool { return $user->isActive(); }
    public function update(User $user, Post $post): bool { return $user->isActive() && $user->id === $post->user_id; }
    public function delete(User $user, Post $post): bool { return $user->id === $post->user_id || $user->is_moderator; }
    public function report(User $user, Post $post): bool { return $user->isActive() && $user->id !== $post->user_id; }
    public function react(User $user, Post $post): bool { return $user->isActive() && $post->status === 'published'; }
    public function comment(User $user, Post $post): bool { return $user->isActive() && $post->status === 'published'; }
}
