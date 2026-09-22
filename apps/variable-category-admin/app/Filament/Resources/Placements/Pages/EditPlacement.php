<?php

namespace App\Filament\Resources\Placements\Pages;

use App\Filament\Resources\Placements\PlacementResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

final class EditPlacement extends EditRecord
{
    protected static string $resource = PlacementResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
