<?php
namespace App\Filament\Resources\FieldDefinitions\Pages;
use App\Filament\Resources\FieldDefinitions\FieldDefinitionResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
final class ListFieldDefinitions extends ListRecords { protected static string $resource = FieldDefinitionResource::class; protected function getHeaderActions(): array { return [CreateAction::make()]; } }
