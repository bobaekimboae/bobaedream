<?php

namespace App\Filament\Resources\FieldDefinitions\Pages;

use App\Filament\Resources\FieldDefinitions\FieldDefinitionResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

final class EditFieldDefinition extends EditRecord
{
    protected static string $resource = FieldDefinitionResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}
