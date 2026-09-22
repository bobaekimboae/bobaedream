<?php

namespace App\Services;

use App\Contracts\ListingGateway;
use App\Domain\Listing\ListingContract;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class DatabaseLegacyListingGateway implements ListingGateway
{
    public function findPublished(string $listingId): ?ListingContract
    {
        $table = (string) config('listing-contract.table');
        $columns = config('listing-contract.columns');

        if (! is_array($columns) || ! preg_match('/^[A-Za-z0-9_]+$/', $table)) {
            throw new RuntimeException('Invalid listing contract configuration.');
        }

        foreach ($columns as $column) {
            if (! is_string($column) || ! preg_match('/^[A-Za-z0-9_]+$/', $column)) {
                throw new RuntimeException('Unsafe legacy column mapping.');
            }
        }

        $row = DB::connection((string) config('listing-contract.connection'))
            ->table($table)
            ->where($columns['id'], $listingId)
            ->whereIn($columns['status'], config('listing-contract.allowed_statuses'))
            ->first(array_values($columns));

        if ($row === null) {
            return null;
        }

        $value = static fn (string $key): mixed => $row->{$columns[$key]} ?? null;

        return new ListingContract(
            listingId: (string) $value('id'),
            legacyCategoryCode: (string) $value('legacy_category_code'),
            sellerType: (string) $value('seller_type'),
            businessCategory: null,
            certification: null,
            manufacturerCode: self::nullableString($value('manufacturer_code')),
            modelCode: self::nullableString($value('model_code')),
            year: self::nullableInt($value('year')),
            price: self::nullableInt($value('price')),
            fuelType: self::nullableString($value('fuel_type')),
            regionCode: self::nullableString($value('region_code')),
            status: (string) $value('status'),
            publishedAt: $value('published_at') ? CarbonImmutable::parse((string) $value('published_at')) : null,
        );
    }

    private static function nullableString(mixed $value): ?string
    {
        return $value === null ? null : (string) $value;
    }

    private static function nullableInt(mixed $value): ?int
    {
        return $value === null ? null : (int) $value;
    }
}
