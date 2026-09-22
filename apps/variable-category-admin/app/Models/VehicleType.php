<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class VehicleType extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = ['system_key', 'name_ko', 'name_en', 'namespace', 'is_active', 'sort_order'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function categoryNodes(): HasMany
    {
        return $this->hasMany(CategoryNode::class);
    }
}
