<?php

return [
    'origins' => array_values(array_filter(array_map('trim', explode(',', (string) env('COMMUNITY_ORIGINS', 'http://localhost:5195'))))),
    // 리뷰 총평 글자 수(원본 懂车分 「再写N字」) · 연비 본문 최대 글자 수
    'review_body' => ['min' => 30, 'max' => 5000],
    'fuel_body' => ['max' => 2000],
    'page_size' => 20,
    'draft_max_bytes' => 262144, // 긴 글 본문(2만 자) + 부품 카드가 들어가도록 256KB
    // 글쓰기 키트(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가) — 화면 nuxt-review/app/components/pub/* 의 제한과 같은 값
    'publish' => [
        'dynamic' => ['images' => 9, 'title' => 30, 'body' => 2000],
        'ask' => ['images' => 9, 'body_min' => 5, 'body' => 2000],
        'video' => ['title' => 30, 'body' => 1000],
        'long' => ['images' => 50, 'title' => 40, 'body' => 20000, 'parts' => 10],
        'sell' => ['images_min' => 1, 'images' => 20, 'title' => 30, 'body' => 2000],
        'price' => ['note' => 300, 'paid_min_ratio' => 0.5],
    ],
    'uploads' => [
        'image_mimes' => ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
        'video_mimes' => ['video/mp4', 'video/quicktime', 'video/webm'],
        'image_max_kb' => 15 * 1024,
        'video_max_kb' => 300 * 1024,
        'video_max_sec' => 600,
        'image_long_edge' => 2560,
        'daily_limit' => 300,
    ],
];
