<?php

namespace App\Filament\Resources\PlacementRules\Pages;

use App\Filament\Resources\PlacementRules\PlacementRuleResource;
use App\Models\PlacementRule;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

/** @property PlacementRule $record */
final class EditPlacementRule extends EditRecord
{
    protected static string $resource = PlacementRuleResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()->visible(fn (): bool => $this->record->status->value !== 'PUBLISHED')];
    }
}
