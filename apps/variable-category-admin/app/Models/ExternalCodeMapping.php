<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

final class ExternalCodeMapping extends Model
{
    use HasUuids;
    protected $fillable = ['source_system', 'source_namespace', 'source_code', 'target_namespace', 'target_system_key', 'mapping_version', 'status', 'valid_from', 'valid_to'];
    protected function casts(): array { return ['valid_from' => 'immutable_datetime', 'valid_to' => 'immutable_datetime']; }
}
