<?php

namespace App\Filament\Resources\ReleaseBundles\Pages;

use App\Domain\Category\Enums\ReleaseStatus;
use App\Filament\Resources\ReleaseBundles\ReleaseBundleResource;
use App\Models\ReleaseBundle;
use App\Services\ReleaseBundlePublisher;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\EditRecord;

/** @property ReleaseBundle $record */
final class EditReleaseBundle extends EditRecord
{
    protected static string $resource = ReleaseBundleResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('qaApprove')->label('QA 승인')->requiresConfirmation()->visible(fn (): bool => $this->record->status === ReleaseStatus::Draft && auth()->user()?->role === 'qa_approver')->action(function (): void {
                $this->record->update(['status' => ReleaseStatus::QaApproved, 'qa_approved_by' => auth()->id(), 'qa_approved_at' => now()]);
                Notification::make()->title('QA 승인 완료')->success()->send();
            }),
            Action::make('publish')->label('배포')->color('danger')->requiresConfirmation()->visible(fn (): bool => $this->record->status === ReleaseStatus::QaApproved && auth()->user()?->role === 'super_admin')->action(function (ReleaseBundlePublisher $publisher): void {
                $publisher->publish($this->record, (int) auth()->id());
                Notification::make()->title('배포 완료')->success()->send();
            }),
        ];
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        if ($this->record->status !== ReleaseStatus::Draft) {
            abort(409, 'Only draft bundles are editable.');
        }

        return $data;
    }
}
