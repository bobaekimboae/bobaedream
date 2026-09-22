<?php

namespace App\Domain\Category\Enums;

enum FieldDataType: string
{
    case String = 'STRING';
    case Integer = 'INTEGER';
    case Decimal = 'DECIMAL';
    case Boolean = 'BOOLEAN';
    case Date = 'DATE';
    case Enum = 'ENUM';
    case MultiEnum = 'MULTI_ENUM';
}
