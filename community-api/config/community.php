<?php

return [
    'origins' => array_values(array_filter(array_map('trim', explode(',', (string) env('COMMUNITY_ORIGINS', 'http://localhost:5195'))))),
    // 리뷰 총평 글자 수(원본 懂车分 「再写N字」) · 연비 본문 최대 글자 수
    'review_body' => ['min' => 30, 'max' => 5000],
    'fuel_body' => ['max' => 2000],
    'page_size' => 20,
];
