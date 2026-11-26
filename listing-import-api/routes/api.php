<?php

use App\Http\Controllers\ListingImportController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [ListingImportController::class, 'health']);
Route::middleware('throttle:30,1')->group(function () {
    Route::post('/listing-imports', [ListingImportController::class, 'store']);
    Route::get('/listing-imports/{id}', [ListingImportController::class, 'show']);
    Route::post('/listing-imports/{id}/recheck', [ListingImportController::class, 'recheck']);
    Route::get('/dealers/{dealerKey}/listings', [ListingImportController::class, 'dealerListings']);
});
