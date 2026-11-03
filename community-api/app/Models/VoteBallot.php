<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VoteBallot extends Model
{
    protected $table = 'community_vote_ballots';
    public $timestamps = false;
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['choices' => 'array'];
    }
}
