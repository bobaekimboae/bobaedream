<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Placement extends Model
{
    use HasUuids;
    protected $fillable = ['system_key', 'name_ko', 'kind', 'analytics_placement_key', 'is_active'];
    protected function casts(): array { return ['is_active' => 'boolean']; }
    public function rules(): HasMany { return $this->hasMany(PlacementRule::class); }
}
