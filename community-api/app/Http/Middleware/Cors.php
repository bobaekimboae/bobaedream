<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/** 허용한 화면 주소에서만 CORS를 연다. 토큰은 Authorization 머리글로만 받는다(쿠키 미사용). */
class Cors
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');
        $allowed = $origin && in_array($origin, config('community.origins'), true);
        $response = $request->isMethod('OPTIONS') ? response('', $allowed ? 204 : 403) : $next($request);
        if ($allowed) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
            $response->headers->set('Access-Control-Max-Age', '600');
        }
        $response->headers->set('Cache-Control', 'no-store');
        return $response;
    }
}
