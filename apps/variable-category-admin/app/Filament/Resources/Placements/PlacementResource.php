<?php

namespace App\Filament\Resources\Placements;

use App\Filament\Resources\Placements\Pages\CreatePlacement;
use App\Filament\Resources\Placements\Pages\EditPlacement;
use App\Filament\Resources\Placements\Pages\ListPlacements;
use App\Models\Placement;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

final class PlacementResource extends Resource
{
    protected static ?string $model = Placement::class;
    protected static ?string $modelLabel = '노출 위치';
    protected static ?string $pluralModelLabel = '노출 위치';
    public static function getNavigationGroup(): ?string { return '노출 정책'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('system_key')->label('Placement 키')->required()->alphaDash()->unique(ignoreRecord: true),
            TextInput::make('name_ko')->label('노출명')->required(),
            Select::make('kind')->options(['GLOBAL' => '전체', 'CATEGORY' => '카테고리', 'THEME' => '테마', 'CAMPAIGN' => '캠페인'])->required(),
            TextInput::make('analytics_placement_key')->label('분석 키')->required()->alphaDash()->unique(ignoreRecord: true),
            Toggle::make('is_active')->label('사용')->default(true),
        ]);
    }
    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('system_key')->label('Placement')->searchable()->copyable(),
            TextColumn::make('name_ko')->label('노출명'),
            TextColumn::make('kind')->badge(),
            TextColumn::make('analytics_placement_key')->label('분석 키')->copyable(),
            IconColumn::make('is_active')->label('사용')->boolean(),
        ]);
    }
    public static function getPages(): array { return ['index' => ListPlacements::route('/'), 'create' => CreatePlacement::route('/create'), 'edit' => EditPlacement::route('/{record}/edit')]; }
}
