<?php

namespace App\Filament\Resources\ReleaseBundles;

use App\Filament\Resources\ReleaseBundles\Pages\CreateReleaseBundle;
use App\Filament\Resources\ReleaseBundles\Pages\EditReleaseBundle;
use App\Filament\Resources\ReleaseBundles\Pages\ListReleaseBundles;
use App\Models\ReleaseBundle;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

final class ReleaseBundleResource extends Resource
{
    protected static ?string $model = ReleaseBundle::class;

    protected static ?string $modelLabel = 'Release Bundle';

    protected static ?string $pluralModelLabel = 'Release Center';

    public static function getNavigationGroup(): string
    {
        return '배포';
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('version')->label('버전')->required()->unique(ignoreRecord: true)->disabled(fn (): bool => auth()->user()?->role === 'qa_approver'),
            Textarea::make('manifest')->label('Manifest JSON')->json()->required()->rows(18)->disabled(fn (): bool => auth()->user()?->role === 'qa_approver')
                ->dehydrateStateUsing(fn (string|array $state): array => is_array($state) ? $state : json_decode($state, true, 512, JSON_THROW_ON_ERROR))
                ->formatStateUsing(fn (mixed $state): string => json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR)),
            Hidden::make('status')->default('DRAFT'),
            Hidden::make('created_by')->default(function (): ?int {
                $id = auth()->id();

                return $id === null ? null : (int) $id;
            }),
            Hidden::make('manifest_hash')->dehydrateStateUsing(function (mixed $state, callable $get): string {
                $manifest = $get('manifest');

                return hash('sha256', json_encode($manifest, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
            }),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            TextColumn::make('version')->label('버전')->searchable()->copyable(),
            TextColumn::make('status')->badge(),
            TextColumn::make('manifest_hash')->label('Manifest Hash')->limit(14)->copyable(),
            TextColumn::make('qa_approved_at')->label('QA 승인')->dateTime('Y-m-d H:i'),
            TextColumn::make('published_at')->label('배포')->dateTime('Y-m-d H:i'),
        ])->defaultSort('created_at', 'desc');
    }

    public static function getPages(): array
    {
        return ['index' => ListReleaseBundles::route('/'), 'create' => CreateReleaseBundle::route('/create'), 'edit' => EditReleaseBundle::route('/{record}/edit')];
    }
}
