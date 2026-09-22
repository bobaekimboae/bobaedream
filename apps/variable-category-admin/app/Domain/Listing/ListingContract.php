<?php

namespace App\Domain\Listing;

use Carbon\CarbonImmutable;

final readonly class ListingContract
{
    /** @param array<string, scalar|array|null> $customAttributes */
    public function __construct(
        public string $listingId,
        public string $legacyCategoryCode,
        public string $sellerType,
        public ?string $businessCategory,
        public ?string $certification,
        public ?string $manufacturerCode,
        public ?string $modelCode,
        public ?int $year,
        public ?int $price,
        public ?string $fuelType,
        public ?string $regionCode,
        public string $status,
        public ?CarbonImmutable $publishedAt,
        public array $customAttributes = [],
    ) {}

    /** @return array<string, scalar|array|null> */
    public function toPredicateContext(): array
    {
        return [
            'listing_id' => $this->listingId,
            'legacy_category_code' => $this->legacyCategoryCode,
            'seller_type' => $this->sellerType,
            'business_category' => $this->businessCategory,
            'certification' => $this->certification,
            'manufacturer_code' => $this->manufacturerCode,
            'model_code' => $this->modelCode,
            'year' => $this->year,
            'price' => $this->price,
            'fuel_type' => $this->fuelType,
            'region_code' => $this->regionCode,
            'status' => $this->status,
            'published_at' => $this->publishedAt?->toIso8601String(),
            'custom' => $this->customAttributes,
        ];
    }
}
