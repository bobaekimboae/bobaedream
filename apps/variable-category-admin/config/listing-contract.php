<?php

return [
    'release_cache_ttl' => (int) env('RELEASE_CACHE_TTL', 300),
    'connection' => env('LEGACY_LISTING_CONNECTION', 'legacy'),
    'table' => env('LEGACY_LISTING_TABLE', 'listings'),
    'columns' => [
        'id' => env('LEGACY_LISTING_ID_COLUMN', 'id'),
        'legacy_category_code' => env('LEGACY_CATEGORY_COLUMN', 'category_code'),
        'seller_type' => env('LEGACY_SELLER_TYPE_COLUMN', 'seller_type'),
        'manufacturer_code' => env('LEGACY_MANUFACTURER_COLUMN', 'manufacturer_code'),
        'model_code' => env('LEGACY_MODEL_COLUMN', 'model_code'),
        'year' => env('LEGACY_YEAR_COLUMN', 'year'),
        'price' => env('LEGACY_PRICE_COLUMN', 'price'),
        'fuel_type' => env('LEGACY_FUEL_COLUMN', 'fuel_type'),
        'region_code' => env('LEGACY_REGION_COLUMN', 'region_code'),
        'status' => env('LEGACY_STATUS_COLUMN', 'status'),
        'published_at' => env('LEGACY_PUBLISHED_AT_COLUMN', 'published_at'),
    ],
    'allowed_statuses' => ['PUBLISHED', 'ACTIVE'],
    'shadow_mode' => (bool) env('RESOLVER_SHADOW_MODE', true),
];
