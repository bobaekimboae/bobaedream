<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

final class AuditLog extends Model
{
    use HasUuids;
    public $timestamps = false;
    const UPDATED_AT = null;
    protected $fillable = ['actor_id', 'action', 'subject_type', 'subject_id', 'before', 'after', 'previous_hash', 'record_hash', 'request_id', 'created_at'];
    protected function casts(): array { return ['before' => 'array', 'after' => 'array', 'created_at' => 'immutable_datetime']; }

    protected static function booted(): void
    {
        static::updating(fn () => throw new \LogicException('Audit logs are append-only.'));
        static::deleting(fn () => throw new \LogicException('Audit logs are append-only.'));
    }
}
