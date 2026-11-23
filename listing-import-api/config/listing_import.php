<?php

// 딜러 매물 가져오기 설정. 비밀값은 .env 에만 둔다(GitHub 금지).
return [
    // 보배드림 본 서버(Laravel)가 이 서비스를 부를 때 쓰는 서비스 토큰
    'service_token' => env('LISTING_IMPORT_TOKEN'),
    'origins' => array_filter(explode(',', (string) env('LISTING_IMPORT_ORIGINS', ''))),

    // 추출 일꾼(Python). 운영은 저장소의 scripts/listing_import/run.py
    'python' => env('LISTING_IMPORT_PYTHON', 'python3'),
    'worker' => env('LISTING_IMPORT_WORKER', base_path('../scripts/listing_import/run.py')),
    'timeout' => (int) env('LISTING_IMPORT_TIMEOUT', 180),
    'work_dir' => env('LISTING_IMPORT_WORK_DIR', storage_path('app/listing-imports')),

    // 사진 저장 디스크(운영: s3 등). 원본 그대로 저장, 가공 없음
    'photo_disk' => env('LISTING_IMPORT_PHOTO_DISK', 'local'),

    // 지원 사이트(KB차차차는 페이지에 수집 금지 표기 → 제외, 엑셀 올리기로 받음)
    'sites' => [
        'encar' => ['encar.com'],
        'seoulautogallery' => ['seoulautogallery.com'],
        'charancha' => ['charancha.com'],
        'koreacarmarket' => ['koreacarmarket.com'],
        'mpark' => ['m-park.co.kr'],
    ],

    // 같은 링크를 다시 가져올 최소 간격(시간). 하루 1번 재확인 기본
    'recheck_hours' => (int) env('LISTING_IMPORT_RECHECK_HOURS', 24),

    // 매물 원장 시트 자동 저장: log(파일) | google(서비스 계정)
    'sheet' => [
        'driver' => env('LISTING_IMPORT_SHEET_DRIVER', 'log'),
        'spreadsheet_id' => env('LISTING_IMPORT_SHEET_ID'),
        'range' => env('LISTING_IMPORT_SHEET_RANGE', '22_매물원장_데이터!A:CO'),
        'credentials' => env('GOOGLE_SERVICE_ACCOUNT_JSON'), // 키 파일 경로
    ],
];
