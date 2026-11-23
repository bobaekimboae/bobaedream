<?php

namespace App\ListingImport;

/** 같은 차 묶기 키: 차량번호 → 차대번호 → 제조사·모델·연식·주행(1천km 단위) */
class CarKey
{
    public static function of(array $cells): ?string
    {
        $v = fn (string $k) => isset($cells[$k]['value']) ? preg_replace('/\s/u', '', mb_strtolower((string) $cells[$k]['value'])) : '';
        if ($v('plate_no') !== '') {
            return hash('sha256', 'plate:' . $v('plate_no'));
        }
        if ($v('vin') !== '') {
            return hash('sha256', 'vin:' . $v('vin'));
        }
        if ($v('make') && $v('model') && $v('year') && $v('mileage_km')) {
            return hash('sha256', 'spec:' . $v('make') . '|' . $v('model') . '|' . $v('year') . '|' . intdiv((int) $v('mileage_km'), 1000));
        }
        return null;
    }
}
