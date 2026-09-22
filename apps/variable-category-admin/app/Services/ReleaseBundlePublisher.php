<?php

namespace App\Services;

use App\Domain\Category\Enums\ReleaseStatus;
use App\Models\ReleaseBundle;
use App\Models\ReleasePointer;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use LogicException;

final class ReleaseBundlePublisher
{
    public function __construct(private readonly AuditLogger $auditLogger) {}

    public function publish(ReleaseBundle $bundle, int $actorId, string $scope = 'GLOBAL'): ReleaseBundle
    {
        if ($bundle->status !== ReleaseStatus::QaApproved || $bundle->qa_approved_by === null) {
            throw new LogicException('Only QA-approved bundles can be published.');
        }

        return DB::transaction(function () use ($bundle, $actorId, $scope): ReleaseBundle {
            $pointer = ReleasePointer::query()->lockForUpdate()->firstOrCreate(['scope' => $scope]);
            $before = $pointer->toArray();

            $pointer->previous_release_bundle_id = $pointer->current_release_bundle_id;
            $pointer->current_release_bundle_id = $bundle->id;
            $pointer->candidate_release_bundle_id = null;
            $pointer->save();

            $bundle->forceFill([
                'status' => ReleaseStatus::Published,
                'published_by' => $actorId,
                'published_at' => now(),
            ])->save();

            DB::table('outbox_events')->insert([
                'id' => (string) Str::uuid(),
                'event_type' => 'CATEGORY_BUNDLE_PUBLISHED',
                'aggregate_type' => 'release_bundle',
                'aggregate_id' => $bundle->id,
                'payload' => json_encode(['scope' => $scope, 'version' => $bundle->version, 'manifest_hash' => $bundle->manifest_hash], JSON_THROW_ON_ERROR),
                'occurred_at' => now(), 'created_at' => now(), 'updated_at' => now(),
            ]);

            $this->auditLogger->record($actorId, 'PUBLISH', ReleaseBundle::class, $bundle->id, $before, $pointer->fresh()->toArray());
            Cache::forget("release-bundle:{$scope}");

            return $bundle->refresh();
        }, attempts: 3);
    }

    public function rollback(int $actorId, string $scope = 'GLOBAL'): ReleasePointer
    {
        return DB::transaction(function () use ($actorId, $scope): ReleasePointer {
            $pointer = ReleasePointer::query()->lockForUpdate()->whereKey($scope)->firstOrFail();
            if ($pointer->previous_release_bundle_id === null) {
                throw new LogicException('No previous release exists.');
            }
            $before = $pointer->toArray();
            [$pointer->current_release_bundle_id, $pointer->previous_release_bundle_id] = [$pointer->previous_release_bundle_id, $pointer->current_release_bundle_id];
            $pointer->candidate_release_bundle_id = null;
            $pointer->save();
            $this->auditLogger->record($actorId, 'ROLLBACK', ReleasePointer::class, $scope, $before, $pointer->toArray());
            Cache::forget("release-bundle:{$scope}");
            return $pointer;
        }, attempts: 3);
    }
}
