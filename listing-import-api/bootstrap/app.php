<?php

use App\Http\Middleware\Cors;
use App\ListingImport\ImportError;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;
use App\Jobs\RunListingImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(Cors::class);
    })
    ->withSchedule(function (Schedule $schedule): void {
        // 판매중 매물을 recheck_hours 마다 다시 읽어 가격·판매완료·사라짐을 갱신(한 번에 50건, 한 건씩 대기열)
        $schedule->call(function (): void {
            $hours = (int) config('listing_import.recheck_hours', 24);
            DB::table('listing_imports')
                ->whereIn('status', ['done', 'needs_review'])
                ->where(fn ($q) => $q->whereNull('listing_status')->orWhere('listing_status', '판매중'))
                ->where('checked_at', '<', now()->subHours($hours))
                ->orderBy('checked_at')->limit(50)->pluck('id')
                ->each(fn ($id) => RunListingImport::dispatch($id));
        })->name('listing-import-recheck')->hourly()->withoutOverlapping();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $r, Throwable $e) => true);
        $exceptions->render(fn (ImportError $e) => response()->json(
            ['ok' => false, 'error' => $e->getMessage(), 'code' => $e->codeName],
            $e->status, [], JSON_UNESCAPED_UNICODE,
        ));
        $exceptions->render(fn (ValidationException $e) => response()->json(
            ['ok' => false, 'error' => '보낸 값이 올바르지 않아요.', 'code' => 'invalid', 'fields' => array_keys($e->errors())],
            422, [], JSON_UNESCAPED_UNICODE,
        ));
    })
    ->create();
