<?php

namespace App\Models;

use App\Community\Board;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;

    protected $table = 'community_posts';
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['board' => Board::class, 'images' => 'array'];
    }

    public function author(): BelongsTo { return $this->belongsTo(User::class, 'user_id'); }
    public function vehicle(): BelongsTo { return $this->belongsTo(VehicleModel::class, 'model_id'); }
    public function review(): HasOne { return $this->hasOne(ReviewDetail::class, 'post_id'); }
    public function fuel(): HasOne { return $this->hasOne(FuelDetail::class, 'post_id'); }
    public function commentList(): HasMany { return $this->hasMany(Comment::class, 'post_id')->whereNull('parent_id')->latest(); }
    public function reactions(): HasMany { return $this->hasMany(Reaction::class, 'post_id'); }
}
