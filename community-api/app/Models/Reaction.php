<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reaction extends Model
{
    protected $table = 'community_reactions';
    public const UPDATED_AT = null;
    protected $guarded = ['id'];
}
