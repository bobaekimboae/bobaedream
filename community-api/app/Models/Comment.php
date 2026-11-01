<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Comment extends Model
{
    use SoftDeletes;

    protected $table = 'community_comments';
    protected $guarded = ['id'];

    public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function post(): BelongsTo { return $this->belongsTo(Post::class, 'post_id'); }
    public function replies(): HasMany { return $this->hasMany(Comment::class, 'parent_id'); }
}
