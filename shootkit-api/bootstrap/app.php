<?php

use App\Http\Middleware\Cors;
use App\Shoot\ShootError;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(Cors::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $r, Throwable $e) => true);
        $exceptions->render(fn (ShootError $e) => response()->json(
            ['ok' => false, 'error' => $e->getMessage(), 'code' => $e->codeName],
            $e->status,
        ));
        $exceptions->render(fn (ValidationException $e) => response()->json(
            ['ok' => false, 'error' => '보낸 값이 올바르지 않아요.', 'code' => 'invalid', 'fields' => array_keys($e->errors())],
            422,
        ));
    })
    ->create();
