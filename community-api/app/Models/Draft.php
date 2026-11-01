<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Draft extends Model
{
    protected $table = 'community_drafts';
    protected $guarded = ['id'];
    protected function casts(): array
    {
        return ['payload' => 'array'];
    }
}
