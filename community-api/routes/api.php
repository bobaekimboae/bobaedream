<?php

use App\Http\Controllers\CommentController;
use App\Http\Controllers\DraftController;
use App\Http\Controllers\MeController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\PublishController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\ReactionController;
use Illuminate\Support\Facades\Route;

// 화면 nuxt-review/app/lib/api/client.ts 의 httpApi 와 1:1. 계약 원본 docs/community-review-api.md · openapi.yaml
Route::prefix('community')->group(function () {
    Route::get('/health', fn () => ['ok' => true]);
    Route::get('/me', [MeController::class, 'show']);
    Route::get('/{board}/posts', [PostController::class, 'index']);
    Route::get('/{board}/posts/{post}', [PostController::class, 'show'])->whereNumber('post');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/review/posts', [PostController::class, 'storeReview'])->middleware('throttle:community-post');
        Route::post('/fuel/posts', [PostController::class, 'storeFuel'])->middleware('throttle:community-post');
        // 글쓰기 키트(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가): 파일을 먼저 올리고 등록할 때 id 로 붙인다
        Route::post('/uploads', [UploadController::class, 'store'])->middleware('throttle:community-upload');
        Route::post('/{board}/posts', [PublishController::class, 'store'])->middleware('throttle:community-post')->whereIn('board', ['dynamic', 'ask', 'video', 'long', 'sell', 'price']);
        Route::put('/{board}/posts/{post}/vote', [PublishController::class, 'vote']);
        Route::get('/drafts', [DraftController::class, 'index']);
        Route::delete('/{board}/posts/{post}', [PostController::class, 'destroy']);

        Route::post('/{board}/posts/{post}/comments', [CommentController::class, 'store'])->middleware('throttle:community-comment');
        Route::delete('/{board}/posts/{post}/comments/{comment}', [CommentController::class, 'destroy']);

        Route::put('/{board}/posts/{post}/reactions/{kind}', [ReactionController::class, 'update']);
        Route::delete('/{board}/posts/{post}/reactions/{kind}', [ReactionController::class, 'destroy']);

        Route::get('/{board}/draft', [DraftController::class, 'show']);
        Route::put('/{board}/draft', [DraftController::class, 'update'])->middleware('throttle:community-draft');
        Route::delete('/{board}/draft', [DraftController::class, 'destroy']);
    });
});
