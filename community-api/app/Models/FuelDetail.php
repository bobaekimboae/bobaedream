<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FuelDetail extends Model
{
    protected $table = 'community_fuel_details';
    protected $primaryKey = 'post_id';
    public $incrementing = false;
    public $timestamps = false;
    protected $guarded = [];
    protected function casts(): array
    {
        return ['fuel_km_per_l' => 'float', 'energy_km_per_kwh' => 'float'];
    }
}
