<?php

namespace App\Community;

/**
 * 동력 방식별 별점 항목. 화면 src/prototype/dealer-page/vehicle-review-data.ts 의 ratingProfiles 와 같아야 한다.
 * 필수 항목은 모두 있어야 하고, 선택 항목은 있어도 되며, 그 밖의 항목은 받지 않는다. 점수는 0.5 단위 0.5~5.0.
 */
final class RatingRules
{
    public const LABELS = [
        'exterior' => '외관', 'interior' => '실내', 'space' => '공간', 'features' => '편의·안전 사양', 'driving' => '주행감',
        'range' => '주행거리·전비', 'adas' => '주행 보조', 'cockpit' => '인포테인먼트', 'power' => '동력·핸들링', 'fuel' => '연비',
    ];

    private const ELECTRIC = ['required' => ['exterior', 'interior', 'space', 'features', 'driving', 'range'], 'optional' => ['adas', 'cockpit']];
    private const COMBUSTION = ['required' => ['exterior', 'interior', 'space', 'features', 'power', 'fuel'], 'optional' => []];

    public const PROFILES = [
        'ev' => self::ELECTRIC, 'phev' => self::ELECTRIC, 'erev' => self::ELECTRIC,
        'hybrid' => self::COMBUSTION, 'ice' => self::COMBUSTION,
    ];

    /** 구매 정보의 실측 값(metric) 단위: 전기 계열 km, 내연 계열 km/L */
    public static function metricUnit(string $powertrain): string
    {
        return in_array($powertrain, ['ev', 'phev', 'erev'], true) ? 'km' : 'km/L';
    }

    /** @return list<string> 틀린 칸 이름(ratings.exterior 등). 빈 배열이면 통과 */
    public static function check(string $powertrain, array $ratings): array
    {
        $profile = self::PROFILES[$powertrain] ?? null;
        if (! $profile) return ['model_id'];
        $bad = [];
        foreach ($profile['required'] as $k) if (! array_key_exists($k, $ratings)) $bad[] = "ratings.$k";
        foreach ($ratings as $k => $v) {
            $known = in_array($k, $profile['required'], true) || in_array($k, $profile['optional'], true);
            $okScore = is_numeric($v) && $v >= 0.5 && $v <= 5 && fmod((float) $v * 2, 1.0) === 0.0;
            if (! $known || ! $okScore) $bad[] = "ratings.$k";
        }
        return array_values(array_unique($bad));
    }

    public static function average(array $ratings): float
    {
        return $ratings ? round(array_sum($ratings) / count($ratings), 2) : 0.0;
    }
}
