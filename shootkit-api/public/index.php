<?php

use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';

// 서버리스: 쓸 수 있는 곳은 /tmp뿐이다.
if (getenv('VERCEL') || getenv('AWS_LAMBDA_FUNCTION_NAME')) {
    $app->useStoragePath('/tmp/storage');
    foreach (['framework/cache', 'framework/views', 'logs'] as $dir) {
        @mkdir('/tmp/storage/' . $dir, 0777, true);
    }
}

$app->handleRequest(Request::capture());
