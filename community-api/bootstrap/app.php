<?php

use App\Community\CommunityError;
use App\Http\Middleware\Cors;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;

// 오류 모양은 모든 경로가 같다: { ok:false, error(한국어 한 줄), code(영문 고정값), fields?(틀린 칸 이름) }
$fail = fn (string $error, string $code, int $status, array $fields = []) => response()->json(
    array_filter(['ok' => false, 'error' => $error, 'code' => $code, 'fields' => $fields ?: null], fn ($v) => $v !== null),
    $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES,
);

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(api: __DIR__ . '/../routes/api.php', apiPrefix: 'api')
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->prepend(Cors::class);
        $middleware->append(\App\Http\Middleware\JsonUnicode::class);
    })
    ->withExceptions(function (Exceptions $exceptions) use ($fail): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $r, Throwable $e) => true);
        $exceptions->render(fn (CommunityError $e) => $fail($e->getMessage(), $e->codeName, $e->status, $e->fields));
        $exceptions->render(fn (ValidationException $e) => $fail('보낸 값이 올바르지 않아요.', 'invalid', 422, array_keys($e->errors())));
        $exceptions->render(fn (AuthenticationException $e) => $fail('로그인이 필요해요.', 'unauthenticated', 401));
        $exceptions->render(fn (AuthorizationException|AccessDeniedHttpException $e) => $fail('이 작업을 할 권한이 없어요.', 'forbidden', 403));
        $exceptions->render(fn (ModelNotFoundException|NotFoundHttpException $e) => $fail('지워졌거나 없는 글이에요.', 'not_found', 404));
        $exceptions->render(fn (TooManyRequestsHttpException $e) => $fail('잠시 뒤에 다시 시도해 주세요.', 'too_many', 429));
    })
    ->create();
