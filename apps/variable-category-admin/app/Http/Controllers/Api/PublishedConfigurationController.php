<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CategoryNode;
use App\Services\PublishedConfiguration;
use Illuminate\Http\JsonResponse;

final class PublishedConfigurationController extends Controller
{
    public function __construct(private readonly PublishedConfiguration $configuration) {}

    public function show(): JsonResponse
    {
        $bundle = $this->configuration->currentBundle();
        abort_if($bundle === null, 503, 'No published release bundle.');
        return response()->json(['data' => ['version' => $bundle->version, 'manifest' => $bundle->manifest, 'resolved_hash' => $bundle->manifest_hash]])->setEtag($bundle->manifest_hash);
    }

    public function vehicleTypes(): JsonResponse
    {
        return response()->json(['data' => $this->configuration->vehicleTypes()]);
    }

    public function registrationSchema(CategoryNode $categoryNode): JsonResponse
    {
        $schema = $this->configuration->registrationSchema($categoryNode);
        abort_if($schema === null, 404, 'No published schema for this category.');
        return response()->json(['data' => $schema]);
    }
}
