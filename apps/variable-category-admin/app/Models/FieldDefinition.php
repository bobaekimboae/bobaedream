<?php

namespace App\Models;

use App\Domain\Category\Enums\FieldDataType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

final class FieldDefinition extends Model
{
    use HasUuids;
    protected $fillable = ['system_key', 'label_ko', 'label_en', 'data_type', 'ui_component', 'unit', 'validation_rules', 'options', 'is_sensitive', 'is_active'];
    protected function casts(): array { return ['data_type' => FieldDataType::class, 'validation_rules' => 'array', 'options' => 'array', 'is_sensitive' => 'boolean', 'is_active' => 'boolean']; }
}
