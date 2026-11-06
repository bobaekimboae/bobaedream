<?php

use App\Http\Controllers\ShootController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [ShootController::class, 'health']);
Route::post('/shoots', [ShootController::class, 'create']);
Route::post('/blob/upload', [ShootController::class, 'blob']);
Route::put('/shoots/{id}/files/{kind}/{name}', [ShootController::class, 'put'])->where(['kind' => 'photo|video', 'name' => '[0-9a-z.-]{5,48}']);
Route::post('/shoots/{id}/submit', [ShootController::class, 'submit']);
Route::get('/shoots/{id}', [ShootController::class, 'show']);
