<?php

namespace App\Domain\Category\Enums;

enum ReleaseStatus: string
{
    case Draft = 'DRAFT';
    case QaApproved = 'QA_APPROVED';
    case Published = 'PUBLISHED';
    case RolledBack = 'ROLLED_BACK';
    case Archived = 'ARCHIVED';
}
