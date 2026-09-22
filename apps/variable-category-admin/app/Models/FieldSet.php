<?php

namespace App\Models;

use App\Domain\Category\Enums\ReleaseStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

final class FieldSet extends Model
{
    use HasUuids;

    protected $fillable = ['system_key', 'name_ko', 'schema_version', 'status', 'applies_to', 'published_at'];

    protected function casts(): array
    {
        return ['status' => ReleaseStatus::class, 'applies_to' => 'array', 'published_at' => 'immutable_datetime'];
    }

    /** @return BelongsToMany<FieldDefinition, $this> */
    public function fields(): BelongsToMany
    {
        return $this->belongsToMany(FieldDefinition::class, 'field_set_items')->withPivot(['context', 'required_level', 'sort_order', 'visibility_rule'])->withTimestamps();
    }
}
