<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

final class ReleasePointer extends Model
{
    protected $primaryKey = 'scope';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['scope', 'current_release_bundle_id', 'candidate_release_bundle_id', 'previous_release_bundle_id'];
}
