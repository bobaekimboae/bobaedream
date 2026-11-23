<?php

namespace App\ListingImport;

class Sites
{
    public const NAMES = ['encar' => '엔카', 'seoulautogallery' => '서울오토갤러리', 'charancha' => '차란차', 'koreacarmarket' => '코리아카마켓', 'mpark' => '엠파크', 'johap' => '조합·매매단지'];

    /** 전국 조합·매매단지 홈페이지 목록(scripts/listing_import/complex_sites.json, 작업기와 같은 파일) */
    public static function registry(): array
    {
        static $sites = null;
        if ($sites === null) {
            $file = (string) config('listing_import.registry');
            $json = is_file($file) ? json_decode((string) file_get_contents($file), true) : null;
            $sites = [];
            foreach ($json['sites'] ?? [] as $s) {
                $fam = $s['family'] ?? '';
                if (in_array($fam, ['carku', 'emi', 'aton', 'attedit', 'autobegins'], true) || ($fam === 'generic' && !empty($s['detail']))) {
                    $sites[$s['domain']] = $s;
                }
            }
        }
        return $sites;
    }

    /** 화면에 쓸 사이트 이름(조합·매매단지는 그 사이트 이름) */
    public static function label(string $site, string $url): string
    {
        if ($site === 'johap') {
            $host = preg_replace('/^(www|m)\./', '', strtolower((string) parse_url($url, PHP_URL_HOST)));
            return self::registry()[$host]['name'] ?? self::NAMES['johap'];
        }
        return self::NAMES[$site] ?? $site;
    }

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
        $bare = preg_replace('/^(www|m)\./', '', $host);
        if (isset(self::registry()[$bare])) {
            return 'johap';
        }
        return null;
    }

    /** 추적용 쿼리(utm 등) 빼고 같은 매물이면 같은 문자열 */
    public static function normalize(string $url): string
    {
        $p = parse_url(trim($url));
        parse_str($p['query'] ?? '', $q);
        $keep = array_intersect_key($q, array_flip(['DemoNo', 'carid', 'carId', 'm_no', 'c_no', 'encOnCarNo', 'OnCarNo', 'seq', 'idx', 'vehiId', 'sCarProductCode']));
        ksort($keep);
        $path = rtrim($p['path'] ?? '/', '/');
        return strtolower($p['host'] ?? '') . $path . ($keep ? '?' . http_build_query($keep) : '');
    }
}
