<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class Cors
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->headers->get('Origin');
        $allowed = $origin && in_array($origin, config('shoot.origins'), true);

        if ($request->isMethod('OPTIONS')) {
            $response = response('', $allowed ? 204 : 403);
        } else {
            $response = $next($request);
        }
        if ($allowed) {
            $response->headers->set('Access-Control-Allow-Origin', $origin);
            $response->headers->set('Vary', 'Origin');
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type');
            $response->headers->set('Access-Control-Max-Age', '600');
        }
        $response->headers->set('Cache-Control', 'no-store');
        return $response;
    }
}
