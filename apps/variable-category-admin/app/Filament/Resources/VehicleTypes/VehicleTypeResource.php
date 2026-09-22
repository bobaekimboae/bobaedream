<?php

namespace App\Filament\Resources\VehicleTypes;

use App\Filament\Resources\VehicleTypes\Pages\CreateVehicleType;
use App\Filament\Resources\VehicleTypes\Pages\EditVehicleType;
use App\Filament\Resources\VehicleTypes\Pages\ListVehicleTypes;
use App\Models\VehicleType;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

final class VehicleTypeResource extends Resource
{
    protected static ?string $model = VehicleType::class;
    protected static ?string $modelLabel = '차량유형';
    protected static ?string $pluralModelLabel = '차량유형';
    public static function getNavigationGroup(): ?string { return '분류 설계'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('system_key')->label('시스템 키')->required()->alphaDash()->maxLength(64)->unique(ignoreRecord: true),
            TextInput::make('name_ko')->label('한국어명')->required()->maxLength(120),
            TextInput::make('name_en')->label('영문명')->maxLength(120),
            Select::make('namespace')->options(['VEHICLE_TYPE' => 'VEHICLE_TYPE', 'ASSET_TYPE' => 'ASSET_TYPE'])->required(),
            TextInput::make('sort_order')->label('정렬')->numeric()->default(0)->minValue(0),
            Toggle::make('is_active')->label('사용')->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('system_key')->label('시스템 키')->searchable()->copyable(),
            TextColumn::make('name_ko')->label('이름')->searchable(),
            TextColumn::make('namespace')->badge(),
            IconColumn::make('is_active')->label('사용')->boolean(),
            TextColumn::make('updated_at')->label('수정일')->dateTime('Y-m-d H:i')->sortable(),
        ])->defaultSort('sort_order');
    }

    public static function getPages(): array
    {
        return ['index' => ListVehicleTypes::route('/'), 'create' => CreateVehicleType::route('/create'), 'edit' => EditVehicleType::route('/{record}/edit')];
    }
}
