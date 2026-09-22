<?php

namespace App\Services;

use App\Models\CategoryNode;
use App\Models\FieldSet;
use App\Models\ReleaseBundle;
use App\Models\ReleasePointer;
use App\Models\VehicleType;
use Illuminate\Support\Facades\Cache;

final class PublishedConfiguration
{
    public function currentBundle(string $scope = 'GLOBAL'): ?ReleaseBundle
    {
        return Cache::remember("release-bundle:{$scope}", (int) env('RELEASE_CACHE_TTL', 300), function () use ($scope): ?ReleaseBundle {
            $id = ReleasePointer::query()->whereKey($scope)->value('current_release_bundle_id');

            return $id ? ReleaseBundle::query()->whereKey($id)->where('status', 'PUBLISHED')->first() : null;
        });
    }

    public function vehicleTypes()
    {
        return VehicleType::query()->where('is_active', true)->orderBy('sort_order')->get(['system_key', 'name_ko', 'name_en']);
    }

    public function registrationSchema(CategoryNode $node): ?FieldSet
    {
        return FieldSet::query()
            ->with(['fields' => fn ($query) => $query->orderBy('field_set_items.sort_order')])
            ->where('status', 'PUBLISHED')
            ->whereJsonContains('applies_to->category_node_keys', $node->system_key)
            ->latest('schema_version')
            ->first();
    }
}
