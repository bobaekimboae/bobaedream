<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

final class CategoryNode extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = ['vehicle_type_id', 'parent_id', 'system_key', 'name_ko', 'name_en', 'depth', 'sort_order', 'is_leaf', 'is_active'];

    protected function casts(): array
    {
        return ['is_leaf' => 'boolean', 'is_active' => 'boolean'];
    }

    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }
}
