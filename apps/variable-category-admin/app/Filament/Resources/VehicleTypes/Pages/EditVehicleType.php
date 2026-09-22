<?php
namespace App\Filament\Resources\VehicleTypes\Pages;
use App\Filament\Resources\VehicleTypes\VehicleTypeResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;
final class EditVehicleType extends EditRecord { protected static string $resource = VehicleTypeResource::class; protected function getHeaderActions(): array { return [DeleteAction::make()]; } }
