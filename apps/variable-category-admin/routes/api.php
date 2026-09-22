<?php

use App\Http\Controllers\Api\PublishedConfigurationController;
use App\Http\Controllers\Api\ResolverPreviewController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->middleware('throttle:api')->group(function (): void {
    Route::get('/health', fn () => response()->json(['status' => 'ok']));
    Route::get('/configuration/current', [PublishedConfigurationController::class, 'show']);
    Route::get('/vehicle-types', [PublishedConfigurationController::class, 'vehicleTypes']);
    Route::get('/registration-schema/{categoryNode:system_key}', [PublishedConfigurationController::class, 'registrationSchema']);
    Route::get('/resolver/preview/{listingId}', ResolverPreviewController::class)
        ->where('listingId', '[A-Za-z0-9_-]{1,128}')
        ->middleware('auth');
});
