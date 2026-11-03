<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vote extends Model
{
    protected $table = 'community_votes';
    protected $primaryKey = 'post_id';
    public $incrementing = false;
    public $timestamps = false;
    protected $guarded = [];
    protected function casts(): array
    {
        return ['multi' => 'boolean', 'options' => 'array', 'ends_at' => 'datetime'];
    }

    public function ballots(): HasMany { return $this->hasMany(VoteBallot::class, 'post_id', 'post_id'); }
}
