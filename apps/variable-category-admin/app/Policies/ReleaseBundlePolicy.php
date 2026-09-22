<?php

namespace App\Policies;

use App\Domain\Category\Enums\ReleaseStatus;
use App\Models\ReleaseBundle;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

final class ReleaseBundlePolicy extends BaseAdminPolicy
{
    public function update(User $user, Model $model): bool
    {
        return $model instanceof ReleaseBundle
            && in_array($user->role, ['category_manager', 'qa_approver'], true)
            && $model->status === ReleaseStatus::Draft;
    }
}
