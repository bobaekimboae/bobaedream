<?php

namespace App\Http\Controllers\Api;

use App\Contracts\ListingGateway;
use App\Http\Controllers\Controller;
use App\Services\PlacementResolver;
use App\Services\PublishedConfiguration;
use Illuminate\Http\JsonResponse;

final class ResolverPreviewController extends Controller
{
    public function __construct(
        private readonly ListingGateway $listings,
        private readonly PlacementResolver $resolver,
        private readonly PublishedConfiguration $configuration,
    ) {}

    public function __invoke(string $listingId): JsonResponse
    {
        $listing = $this->listings->findPublished($listingId);
        abort_if($listing === null, 404, 'Listing not found or not published.');
        $bundle = $this->configuration->currentBundle();
        abort_if($bundle === null, 503, 'No published release bundle.');
        $matches = $this->resolver->resolve($listing);

        return response()->json(['data' => [
            'listing_id' => $listing->listingId,
            'bundle_version' => $bundle->version,
            'matches' => $matches,
            'resolved_hash' => $this->resolver->resolvedHash($listing, $matches, $bundle->manifest_hash),
        ]]);
    }
}
