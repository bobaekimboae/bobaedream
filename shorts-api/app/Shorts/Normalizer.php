<?php

namespace App\Shorts;

/**
 * 보배드림 백엔드 매물(/v2/cars/shorts 의 data[0])을 숏폼 화면 계약 모양으로 바꾼다.
 * 차량번호·안심번호 원문은 화면 계약에 넣지 않는다(안심번호는 tel 링크용으로 숫자만 따로).
 */
class Normalizer
{
    public static function video(?string $url): ?array
    {
        if (! $url) {
            return null;
        }
        if (preg_match('~(?:youtube\.com/(?:shorts/|watch\?v=|embed/)|youtu\.be/)([A-Za-z0-9_-]{6,20})~', $url, $m)) {
            return ['kind' => 'youtube', 'id' => $m[1], 'url' => $url];
        }
        if (preg_match('~^https://[^\s]+\.(mp4|webm|mov|m3u8)(\?.*)?$~i', $url, $m)) {
            return ['kind' => strtolower($m[1]) === 'm3u8' ? 'hls' : 'file', 'url' => $url];
        }
        return null;
    }

    public static function car(array $c): ?array
    {
        $video = self::video($c['videos'][0] ?? null);
        if (! $video) {
            return null;
        }
        $images = array_values(array_filter(array_map(
            fn ($i) => is_array($i) && ! empty($i['url']) ? ['url' => $i['url'], 'type' => $i['type'] ?? null] : null,
            $c['images'] ?? []
        )));
        $region = trim(implode(' ', array_filter([$c['region_sido'] ?? null, $c['region_gugun'] ?? null]))) ?: ($c['address'] ?? null);
        $complex = $c['dealer_complex_name'] ?? $c['seller_dealer_complex_name'] ?? null;
        $phone = preg_replace('/[^0-9]/', '', (string) ($c['safe_phone_number'] ?? ''));

        return [
            'id' => (string) $c['public_id'],
            'title' => $c['car_name'] ?? trim(($c['maker_name'] ?? '') . ' ' . ($c['model_name'] ?? '')),
            'maker' => $c['maker_name'] ?? null,
            'model' => $c['model_name'] ?? null,
            'year' => isset($c['model_year']) ? (int) $c['model_year'] : null,
            'registered' => self::yyyymm($c['first_register'] ?? null) ?? self::yyyymm(isset($c['model_month']) ? (string) $c['model_month'] : null),
            'mileage' => $c['mileage'] ?? null,
            'fuel' => $c['fuel_type'] ?? null,
            'transmission' => $c['transmission'] ?? null,
            'price' => $c['sale_price'] ?? null,
            'region' => $region,
            'complex' => $complex,
            'hashtags' => array_values(array_filter($c['hashtags'] ?? [], 'is_string')),
            'status' => $c['status'] ?? null,
            'video' => $video,
            'poster' => $images[0]['url'] ?? null,
            'images' => $images,
            'likes' => (int) ($c['like_count'] ?? 0),
            'liked' => (bool) ($c['is_liked'] ?? false),
            'views' => (int) ($c['view_count'] ?? 0),
            'seller' => [
                'id' => $c['seller_user_public_id'] ?? null,
                'name' => $c['seller_name'] ?? null,
                'company' => $c['seller_company_name'] ?? null,
                'type' => ($c['seller_type'] ?? null) === 'D' ? 'dealer' : 'private',
                'avatar' => $c['seller_profile_image_url'] ?? null,
                'selling' => (int) ($c['seller_selling_count'] ?? 0),
                'sold' => (int) ($c['seller_sold_count'] ?? 0),
                'phone' => strlen($phone) >= 9 ? $phone : null,
                'can_inquire' => (bool) ($c['can_inquire'] ?? true),
            ],
            'updated_at' => $c['updated_at'] ?? null,
            'chapters' => [],
        ];
    }

    private static function yyyymm(?string $v): ?string
    {
        if (! $v || ! preg_match('/^(\d{4})(\d{2})/', $v, $m)) {
            return null;
        }
        return $m[1] . '.' . $m[2];
    }
}
