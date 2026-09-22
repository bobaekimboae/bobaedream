<?php

namespace App\Models;

use App\Domain\Category\Enums\ReleaseStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

final class ReleaseBundle extends Model
{
    use HasUuids;

    protected $fillable = ['version', 'status', 'manifest', 'manifest_hash', 'created_by', 'qa_approved_by', 'published_by', 'qa_approved_at', 'published_at'];

    protected function casts(): array
    {
        return ['status' => ReleaseStatus::class, 'manifest' => 'array', 'qa_approved_at' => 'immutable_datetime', 'published_at' => 'immutable_datetime'];
    }
}
