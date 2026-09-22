<?php

namespace App\Services;

use App\Domain\Listing\ListingContract;
use App\Models\PlacementRule;

final class PlacementResolver
{
    public function __construct(private readonly PredicateEvaluator $evaluator) {}

    /** @return array<int, array{placement:string, rule:string, version:int}> */
    public function resolve(ListingContract $listing): array
    {
        $context = $listing->toPredicateContext();

        return PlacementRule::query()
            ->with('placement')
            ->where('status', 'PUBLISHED')
            ->get()
            ->filter(fn (PlacementRule $rule): bool => $this->evaluator->matches($rule->predicate, $context))
            ->map(fn (PlacementRule $rule): array => [
                'placement' => $rule->placement->system_key,
                'rule' => $rule->system_key,
                'version' => $rule->version,
            ])->values()->all();
    }

    /** @param array<int, array<string, mixed>> $matches */
    public function resolvedHash(ListingContract $listing, array $matches, string $bundleHash): string
    {
        return hash('sha256', json_encode([$listing->toPredicateContext(), $matches, $bundleHash], JSON_THROW_ON_ERROR));
    }
}
