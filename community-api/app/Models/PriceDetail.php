<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PriceDetail extends Model
{
    protected $table = 'community_price_details';
    protected $primaryKey = 'post_id';
    public $incrementing = false;
    public $timestamps = false;
    protected $guarded = [];
    protected function casts(): array
    {
        return ['list_price' => 'float', 'paid_price' => 'float'];
    }
}
