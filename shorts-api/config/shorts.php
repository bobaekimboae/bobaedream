<?php

return [
    // 실매물 원본: 보배드림 리뉴얼 백엔드(staging). 운영은 같은 도메인의 내부 주소로 바꾼다.
    'upstream' => rtrim(env('SHORTS_UPSTREAM', 'https://staging.bbmuseum.co.kr'), '/'),
    'upstream_timeout' => (int) env('SHORTS_UPSTREAM_TIMEOUT', 8),

    // 숏폼을 부르는 화면 주소(CORS)
    'origins' => array_filter(explode(',', env('SHORTS_ORIGINS',
        'https://bobaekimboae.github.io,https://dev.bbmuseum.co.kr,http://localhost:5197,http://127.0.0.1:5197'))),

    // 피드 한 번에 줄 수, 원본을 다시 묻기 전 기억 시간(초)
    'page_size' => 8,
    'max_page_size' => 20,
    'cache_ttl' => (int) env('SHORTS_CACHE_TTL', 60),

    // 부위 시각(비디오 투어)을 저장할 수 있는 관리자 토큰
    'admin_token' => env('SHORTS_ADMIN_TOKEN'),

    // 비디오 투어 부위 키(nuxt-shootkit shoot-items-kit.json video.tour 와 같음)
    'chapter_keys' => ['tour-walk', 'tour-feature', 'tour-dash', 'tour-seat', 'tour-pov', 'tour-boot', 'tour-tyre', 'tour-engine'],

    // 시청 기록: 같은 사람·같은 매물은 이 시간(초) 안에 한 번만 센다
    'view_window' => 1800,
];
