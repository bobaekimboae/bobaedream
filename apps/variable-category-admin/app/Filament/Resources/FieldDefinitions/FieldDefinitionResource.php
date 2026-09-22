<?php

namespace App\Filament\Resources\FieldDefinitions;

use App\Domain\Category\Enums\FieldDataType;
use App\Filament\Resources\FieldDefinitions\Pages\CreateFieldDefinition;
use App\Filament\Resources\FieldDefinitions\Pages\EditFieldDefinition;
use App\Filament\Resources\FieldDefinitions\Pages\ListFieldDefinitions;
use App\Models\FieldDefinition;
use Filament\Forms\Components\KeyValue;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

final class FieldDefinitionResource extends Resource
{
    protected static ?string $model = FieldDefinition::class;
    protected static ?string $modelLabel = '필드';
    protected static ?string $pluralModelLabel = '필드 코드북';
    public static function getNavigationGroup(): ?string { return '스키마 설계'; }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('system_key')->label('필드 키')->required()->alphaDash()->unique(ignoreRecord: true),
            TextInput::make('label_ko')->label('한국어명')->required(),
            TextInput::make('label_en')->label('영문명'),
            Select::make('data_type')->options(collect(FieldDataType::cases())->mapWithKeys(fn ($case) => [$case->value => $case->value]))->required(),
            Select::make('ui_component')->options(['TEXT' => '텍스트', 'NUMBER' => '숫자', 'SELECT' => '선택', 'MULTI_SELECT' => '다중 선택', 'TOGGLE' => '토글', 'DATE' => '날짜', 'RANGE' => '범위'])->required(),
            TextInput::make('unit')->label('단위')->maxLength(32),
            KeyValue::make('validation_rules')->label('검증 규칙'),
            KeyValue::make('options')->label('선택값'),
            Toggle::make('is_sensitive')->label('민감정보'),
            Toggle::make('is_active')->label('사용')->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('system_key')->label('필드 키')->searchable()->copyable(),
            TextColumn::make('label_ko')->label('필드명')->searchable(),
            TextColumn::make('data_type')->badge(),
            TextColumn::make('ui_component')->badge(),
            TextColumn::make('unit')->label('단위'),
            IconColumn::make('is_sensitive')->label('민감')->boolean(),
            IconColumn::make('is_active')->label('사용')->boolean(),
        ]);
    }

    public static function getPages(): array
    {
        return ['index' => ListFieldDefinitions::route('/'), 'create' => CreateFieldDefinition::route('/create'), 'edit' => EditFieldDefinition::route('/{record}/edit')];
    }
}
