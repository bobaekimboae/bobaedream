<?php

use App\Http\Controllers\ShortsController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [ShortsController::class, 'health']);
Route::get('/shorts', [ShortsController::class, 'index']);
Route::get('/shorts/{id}', [ShortsController::class, 'show']);
Route::match(['put', 'delete'], '/shorts/{id}/like', [ShortsController::class, 'like']);
Route::post('/shorts/{id}/views', [ShortsController::class, 'view']);
Route::put('/shorts/{id}/chapters', [ShortsController::class, 'chapters']);
