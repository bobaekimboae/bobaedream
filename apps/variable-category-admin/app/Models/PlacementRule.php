<?php

namespace App\Models;

use App\Domain\Category\Enums\ReleaseStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property array<string, mixed> $predicate
 * @property ReleaseStatus $status
 * @property string $system_key
 * @property int $version
 * @property-read Placement $placement
 */
final class PlacementRule extends Model
{
    use HasUuids;

    protected $fillable = ['placement_id', 'system_key', 'version', 'predicate', 'status', 'breaking_change'];

    protected function casts(): array
    {
        return ['predicate' => 'array', 'status' => ReleaseStatus::class];
    }

    /** @return BelongsTo<Placement, $this> */
    public function placement(): BelongsTo
    {
        return $this->belongsTo(Placement::class);
    }
}
