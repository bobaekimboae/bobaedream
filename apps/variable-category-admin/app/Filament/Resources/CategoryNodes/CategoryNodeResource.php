<?php

namespace App\Filament\Resources\CategoryNodes;

use App\Filament\Resources\CategoryNodes\Pages\CreateCategoryNode;
use App\Filament\Resources\CategoryNodes\Pages\EditCategoryNode;
use App\Filament\Resources\CategoryNodes\Pages\ListCategoryNodes;
use App\Models\CategoryNode;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

final class CategoryNodeResource extends Resource
{
    protected static ?string $model = CategoryNode::class;

    protected static ?string $modelLabel = '카테고리';

    protected static ?string $pluralModelLabel = '카테고리 트리';

    public static function getNavigationGroup(): ?string
    {
        return '분류 설계';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('vehicle_type_id')->label('차량유형')->relationship('vehicleType', 'name_ko')->searchable()->preload()->required(),
            Select::make('parent_id')->label('상위 카테고리')->relationship('parent', 'name_ko')->searchable()->preload(),
            TextInput::make('system_key')->label('시스템 키')->required()->alphaDash()->maxLength(96)->unique(ignoreRecord: true),
            TextInput::make('name_ko')->label('한국어명')->required()->maxLength(160),
            TextInput::make('name_en')->label('영문명')->maxLength(160),
            TextInput::make('depth')->numeric()->minValue(0)->maxValue(8)->default(0)->required(),
            TextInput::make('sort_order')->numeric()->minValue(0)->default(0),
            Toggle::make('is_leaf')->label('말단 노드'),
            Toggle::make('is_active')->label('사용')->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('vehicleType.name_ko')->label('유형')->badge()->sortable(),
            TextColumn::make('system_key')->label('시스템 키')->searchable()->copyable(),
            TextColumn::make('name_ko')->label('카테고리')->searchable(),
            TextColumn::make('parent.name_ko')->label('상위'),
            TextColumn::make('depth')->label('깊이')->sortable(),
            IconColumn::make('is_leaf')->label('말단')->boolean(),
            IconColumn::make('is_active')->label('사용')->boolean(),
        ])->filters([SelectFilter::make('vehicle_type_id')->label('차량유형')->relationship('vehicleType', 'name_ko')]);
    }

    public static function getPages(): array
    {
        return ['index' => ListCategoryNodes::route('/'), 'create' => CreateCategoryNode::route('/create'), 'edit' => EditCategoryNode::route('/{record}/edit')];
    }
}
