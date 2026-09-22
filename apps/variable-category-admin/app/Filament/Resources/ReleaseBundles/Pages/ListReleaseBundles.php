<?php

namespace App\Filament\Resources\ReleaseBundles\Pages;

use App\Filament\Resources\ReleaseBundles\ReleaseBundleResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

final class ListReleaseBundles extends ListRecords
{
    protected static string $resource = ReleaseBundleResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}
