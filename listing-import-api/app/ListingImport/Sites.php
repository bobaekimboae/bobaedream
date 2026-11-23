<?php

namespace App\ListingImport;

class Sites
{
    public const NAMES = ['encar' => '엔카', 'seoulautogallery' => '서울오토갤러리', 'charancha' => '차란차', 'koreacarmarket' => '코리아카마켓', 'mpark' => '엠파크'];

    public static function detect(string $url): ?string
    {
        $host = strtolower((string) parse_url($url, PHP_URL_HOST));
        foreach (config('listing_import.sites') as $site => $domains) {
            foreach ($domains as $d) {
                if ($host === $d || str_ends_with($host, '.' . $d)) {
                    return $site;
                }
            }
        }
        return null;
    }

    /** 추적용 쿼리(utm 등) 빼고 같은 매물이면 같은 문자열 */
    public static function normalize(string $url): string
    {
        $p = parse_url(trim($url));
        parse_str($p['query'] ?? '', $q);
        $keep = array_intersect_key($q, array_flip(['DemoNo', 'carid', 'carId', 'm_no']));
        ksort($keep);
        $path = rtrim($p['path'] ?? '/', '/');
        return strtolower($p['host'] ?? '') . $path . ($keep ? '?' . http_build_query($keep) : '');
    }
}
