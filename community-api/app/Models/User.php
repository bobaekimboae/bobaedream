<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = ['nickname', 'avatar', 'email', 'password'];
    protected $hidden = ['password', 'email'];
    protected function casts(): array
    {
        return ['password' => 'hashed', 'suspended_until' => 'datetime', 'is_moderator' => 'boolean'];
    }

    /** 정지 중이면 쓰기 · 댓글 · 반응을 막는다(읽기는 됨) */
    public function isActive(): bool
    {
        return ! $this->suspended_until || $this->suspended_until->isPast();
    }
}
