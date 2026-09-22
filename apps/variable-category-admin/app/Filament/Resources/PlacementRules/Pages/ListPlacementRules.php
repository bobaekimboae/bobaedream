<?php
namespace App\Filament\Resources\PlacementRules\Pages;
use App\Filament\Resources\PlacementRules\PlacementRuleResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;
final class ListPlacementRules extends ListRecords { protected static string $resource = PlacementRuleResource::class; protected function getHeaderActions(): array { return [CreateAction::make()]; } }
