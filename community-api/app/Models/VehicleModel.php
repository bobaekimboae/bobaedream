<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VehicleModel extends Model
{
    protected $table = 'community_vehicle_models';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;
    protected $guarded = [];
    protected function casts(): array
    {
        return ['segment_score' => 'float'];
    }
}
