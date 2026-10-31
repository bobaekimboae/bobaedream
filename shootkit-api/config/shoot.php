<?php

return [
    // blob = Vercel Blob에 JSON으로 기록(임시 무료 서버), db = PostgreSQL(리뉴얼 운영)
    'store' => env('SHOOT_STORE', 'blob'),

    // 업로드를 허락하는 화면 주소
    'origins' => array_filter(explode(',', env('SHOOT_ORIGINS',
        'https://bobaekimboae.github.io,http://localhost:5191,http://127.0.0.1:5191'))),

    // 한 촬영에 올릴 수 있는 수와 크기
    'limits' => [
        'photo' => ['count' => 30, 'bytes' => 15 * 1024 * 1024,
            'types' => ['image/jpeg', 'image/png', 'image/webp']],
        'video' => ['count' => 12, 'bytes' => 300 * 1024 * 1024,
            'types' => ['video/mp4', 'video/webm', 'video/quicktime']],
    ],

    // 업로드 허가표 유효 시간(초)
    'token_ttl' => 3600,

    'blob' => [
        'token' => env('BLOB_READ_WRITE_TOKEN'),
        'api' => env('VERCEL_BLOB_API_URL', 'https://vercel.com/api/blob'),
        'version' => '11',
    ],
];
