<?php

namespace App\Contracts;

use App\Domain\Listing\ListingContract;

interface ListingGateway
{
    public function findPublished(string $listingId): ?ListingContract;
}
