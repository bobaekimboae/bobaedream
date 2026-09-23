<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Validation\ValidationException;

final class CategoryNode extends Model
{
    use HasUuids;
    use SoftDeletes;

    protected $fillable = ['vehicle_type_id', 'parent_id', 'system_key', 'name_ko', 'name_en', 'sort_order', 'is_active'];

    protected function casts(): array
    {
        return ['is_leaf' => 'boolean', 'is_active' => 'boolean'];
    }

    protected static function booted(): void
    {
        static::saving(function (self $node): void {
            $nextDepth = 1;
            if ($node->parent_id === null) {
                $nextDepth = 1;
            } else {
                $parent = self::query()->find($node->parent_id);
                if ($parent === null) {
                    throw ValidationException::withMessages(['parent_id' => '상위 카테고리를 찾을 수 없습니다.']);
                }
                if ($parent->vehicle_type_id !== $node->vehicle_type_id) {
                    throw ValidationException::withMessages(['parent_id' => '다른 차량유형·자산유형의 노드를 상위로 지정할 수 없습니다.']);
                }

                $cursor = $parent;
                $visited = [];
                while ($cursor !== null) {
                    if ($node->id !== null && $cursor->id === $node->id) {
                        throw ValidationException::withMessages(['parent_id' => '자기 자신 또는 하위 카테고리를 상위로 지정할 수 없습니다.']);
                    }
                    if (isset($visited[$cursor->id])) {
                        throw ValidationException::withMessages(['parent_id' => '카테고리 트리에 순환 참조가 있습니다.']);
                    }
                    $visited[$cursor->id] = true;
                    $cursor = $cursor->parent_id === null ? null : self::query()->find($cursor->parent_id);
                }

                $nextDepth = $parent->depth + 1;
            }

            $subtreeHeight = $node->exists ? self::subtreeHeight((string) $node->id) : 0;
            if ($nextDepth + $subtreeHeight > 8) {
                throw ValidationException::withMessages(['parent_id' => '카테고리 깊이는 8단계를 초과할 수 없습니다.']);
            }

            $node->depth = $nextDepth;
            $node->is_leaf = ! $node->exists || ! self::query()->where('parent_id', $node->id)->exists();
        });

        static::saved(function (self $node): void {
            $originalParentId = $node->getOriginal('parent_id');
            self::refreshLeafFlag(is_string($originalParentId) ? $originalParentId : null);
            self::refreshLeafFlag($node->parent_id);
            self::refreshDescendantDepths($node);
        });

        static::deleted(function (self $node): void {
            self::refreshLeafFlag($node->parent_id);
        });

        static::restored(function (self $node): void {
            self::refreshLeafFlag($node->parent_id);
        });
    }

    /** @param array<string, bool> $visited */
    private static function subtreeHeight(string $nodeId, array $visited = []): int
    {
        if (isset($visited[$nodeId])) {
            throw ValidationException::withMessages(['parent_id' => '카테고리 트리에 순환 참조가 있습니다.']);
        }
        $visited[$nodeId] = true;
        $max = 0;
        foreach (self::query()->where('parent_id', $nodeId)->pluck('id') as $childId) {
            $max = max($max, 1 + self::subtreeHeight((string) $childId, $visited));
        }

        return $max;
    }

    private static function refreshLeafFlag(?string $nodeId): void
    {
        if ($nodeId === null) {
            return;
        }
        self::query()->whereKey($nodeId)->update([
            'is_leaf' => ! self::query()->where('parent_id', $nodeId)->exists(),
        ]);
    }

    private static function refreshDescendantDepths(self $parent): void
    {
        foreach (self::query()->where('parent_id', $parent->id)->get() as $child) {
            $expectedDepth = $parent->depth + 1;
            if ($child->depth !== $expectedDepth) {
                self::withoutEvents(fn () => $child->forceFill(['depth' => $expectedDepth])->save());
            }
            self::refreshDescendantDepths($child);
        }
    }

    /** @return BelongsTo<VehicleType, $this> */
    public function vehicleType(): BelongsTo
    {
        return $this->belongsTo(VehicleType::class);
    }

    /** @return BelongsTo<CategoryNode, $this> */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /** @return HasMany<CategoryNode, $this> */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }
}
