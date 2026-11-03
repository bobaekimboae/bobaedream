<?php
// 시험용 가짜 원본: /v2/cars/shorts 를 보배드림 백엔드와 같은 모양(한 매물 + 앞·뒤)으로 흉내 낸다.
$chain = [
    ['public_id' => 'aaaa1111', 'car_name' => '현대 포터2', 'videos' => ['https://m.youtube.com/shorts/TO1UNT8gaak'], 'safe_phone_number' => '0504-1111-2222', 'seller_type' => 'D'],
    ['public_id' => 'bbbb2222', 'car_name' => '기아 봉고3', 'videos' => [], 'seller_type' => 'P'],
    ['public_id' => 'cccc3333', 'car_name' => '롤스로이스 던', 'videos' => ['https://file9.bobaedream.co.kr/v/x_714.mp4'], 'images' => [['url' => 'https://file9.bobaedream.co.kr/p/1.png', 'type' => 'front']], 'seller_type' => 'D'],
];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
header('Content-Type: application/json');
if (preg_match('~^/v2/cars/([^/]+)/like$~', $path)) {
    if (($_SERVER['HTTP_AUTHORIZATION'] ?? '') !== 'Bearer good') {
        http_response_code(401);
        echo '{"message":"Unauthenticated."}';
        exit;
    }
    echo json_encode(['data' => ['like_count' => $_SERVER['REQUEST_METHOD'] === 'PUT' ? 2 : 1]]);
    exit;
}
if ($path !== '/v2/cars/shorts') {
    http_response_code(404);
    echo '{"message":"x"}';
    exit;
}
$body = json_decode(file_get_contents('php://input'), true) ?: [];
$i = 0;
if (! empty($body['public_car_id'])) {
    $i = array_search($body['public_car_id'], array_column($chain, 'public_id'), true);
    if ($i === false) {
        http_response_code(404);
        echo '{"message":"x"}';
        exit;
    }
}
$nav = fn ($j) => isset($chain[$j]) ? ['public_id' => $chain[$j]['public_id']] : null;
echo json_encode(['data' => [$chain[$i]], 'meta' => ['navigation' => ['previous' => $nav($i - 1), 'next' => $nav($i + 1)]]]);
