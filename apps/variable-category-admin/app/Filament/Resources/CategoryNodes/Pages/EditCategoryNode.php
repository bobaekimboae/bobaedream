<?php
namespace App\Filament\Resources\CategoryNodes\Pages;
use App\Filament\Resources\CategoryNodes\CategoryNodeResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
final class EditCategoryNode extends EditRecord { protected static string $resource = CategoryNodeResource::class; protected function getHeaderActions(): array { return [DeleteAction::make()]; } }
