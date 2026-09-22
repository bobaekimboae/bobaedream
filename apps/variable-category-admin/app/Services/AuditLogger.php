<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Str;

final class AuditLogger
{
    /**
     * @param array<string, mixed>|null $before
     * @param array<string, mixed>|null $after
     */
    public function record(?int $actorId, string $action, string $subjectType, string $subjectId, ?array $before, ?array $after): AuditLog
    {
        $previousHash = AuditLog::query()->lockForUpdate()->latest('created_at')->value('record_hash');
        $createdAt = now();
        $payload = [$actorId, $action, $subjectType, $subjectId, $before, $after, $previousHash, $createdAt->toISOString()];

        return AuditLog::query()->create([
            'actor_id' => $actorId,
            'action' => $action,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'before' => $before,
            'after' => $after,
            'previous_hash' => $previousHash,
            'record_hash' => hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR)),
            'request_id' => request()->header('X-Request-Id', (string) Str::uuid()),
            'created_at' => $createdAt,
        ]);
    }
}
