<?php

namespace App\Filament\Resources\CategoryNodes\Pages;

use App\Filament\Resources\CategoryNodes\CategoryNodeResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

final class ListCategoryNodes extends ListRecords
{
    protected static string $resource = CategoryNodeResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
