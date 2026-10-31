<?php

use App\Http\Controllers\ShootController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [ShootController::class, 'health']);
Route::post('/shoots', [ShootController::class, 'create']);
Route::post('/blob/upload', [ShootController::class, 'blob']);
Route::post('/shoots/{id}/submit', [ShootController::class, 'submit']);
Route::get('/shoots/{id}', [ShootController::class, 'show']);
