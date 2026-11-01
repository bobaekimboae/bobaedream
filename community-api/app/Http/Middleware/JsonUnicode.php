<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** 한글 · 경로를 \uXXXX · \/ 로 바꾸지 않고 그대로 보낸다(로그 · 디버깅이 쉬움) */
class JsonUnicode
{
    public function handle(Request $request, Closure $next): Response
    {
        $res = $next($request);
        if ($res instanceof JsonResponse) $res->setEncodingOptions($res->getEncodingOptions() | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $res;
    }
}
