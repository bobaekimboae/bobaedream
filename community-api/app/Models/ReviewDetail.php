<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReviewDetail extends Model
{
    protected $table = 'community_review_details';
    protected $primaryKey = 'post_id';
    public $incrementing = false;
    public $timestamps = false;
    protected $guarded = [];
    protected function casts(): array
    {
        return ['owner' => 'boolean', 'ratings' => 'array', 'rating' => 'float', 'purchase_metric' => 'float'];
    }
}
