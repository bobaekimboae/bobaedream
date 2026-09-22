<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

abstract class BaseAdminPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->role === 'super_admin' ? true : null;
    }
    public function viewAny(User $user): bool { return in_array($user->role, ['category_manager', 'qa_approver', 'viewer'], true); }
    public function view(User $user, Model $model): bool { return $this->viewAny($user); }
    public function create(User $user): bool { return $user->role === 'category_manager'; }
    public function update(User $user, Model $model): bool { return $user->role === 'category_manager' && (string) data_get($model, 'status.value', data_get($model, 'status', 'DRAFT')) === 'DRAFT'; }
    public function delete(User $user, Model $model): bool { return false; }
    public function deleteAny(User $user): bool { return false; }
    public function restore(User $user, Model $model): bool { return false; }
    public function forceDelete(User $user, Model $model): bool { return false; }
}
