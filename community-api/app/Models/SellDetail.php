<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SellDetail extends Model
{
    protected $table = 'community_sell_details';
    protected $primaryKey = 'post_id';
    public $incrementing = false;
    public $timestamps = false;
    protected $guarded = [];
}
