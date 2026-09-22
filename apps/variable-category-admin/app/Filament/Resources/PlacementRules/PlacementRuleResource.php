<?php

namespace App\Filament\Resources\PlacementRules;

use App\Domain\Category\Enums\ReleaseStatus;
use App\Filament\Resources\PlacementRules\Pages\CreatePlacementRule;
use App\Filament\Resources\PlacementRules\Pages\EditPlacementRule;
use App\Filament\Resources\PlacementRules\Pages\ListPlacementRules;
use App\Models\PlacementRule;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

final class PlacementRuleResource extends Resource
{
    protected static ?string $model = PlacementRule::class;

    protected static ?string $modelLabel = '노출 규칙';

    protected static ?string $pluralModelLabel = '노출 규칙';

    public static function getNavigationGroup(): string
    {
        return '노출 정책';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('placement_id')->label('노출 위치')->relationship('placement', 'name_ko')->searchable()->preload()->required(),
            TextInput::make('system_key')->label('규칙 키')->required()->alphaDash()->unique(ignoreRecord: true),
            TextInput::make('version')->numeric()->minValue(1)->default(1)->required(),
            Textarea::make('predicate')->label('Search Predicate Contract JSON')->required()->json()->rows(12)
                ->dehydrateStateUsing(fn (string|array $state): array => is_array($state) ? $state : json_decode($state, true, 512, JSON_THROW_ON_ERROR))
                ->formatStateUsing(fn (mixed $state): string => json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)),
            Select::make('status')->options(['DRAFT' => 'Draft', 'QA_APPROVED' => 'QA 승인', 'PUBLISHED' => 'Published', 'ROLLED_BACK' => 'Rollback'])->default('DRAFT')->disabled(fn (?PlacementRule $record): bool => $record !== null && $record->status === ReleaseStatus::Published),
            Select::make('breaking_change')->options(['NONE' => '없음', 'BACKWARD_COMPATIBLE' => '호환', 'BREAKING' => 'Breaking'])->default('NONE')->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('placement.name_ko')->label('노출 위치'),
            TextColumn::make('system_key')->label('규칙')->searchable()->copyable(),
            TextColumn::make('version')->label('버전')->sortable(),
            TextColumn::make('status')->badge(),
            TextColumn::make('breaking_change')->label('변경 등급')->badge(),
            TextColumn::make('updated_at')->label('수정일')->dateTime('Y-m-d H:i'),
        ]);
    }

    public static function getPages(): array
    {
        return ['index' => ListPlacementRules::route('/'), 'create' => CreatePlacementRule::route('/create'), 'edit' => EditPlacementRule::route('/{record}/edit')];
    }
}
