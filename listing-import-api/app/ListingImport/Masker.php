<?php

namespace App\ListingImport;

/** 화면·API 응답용 가림. 원문은 DB·시트 내부 칸에만 */
class Masker
{
    public const INTERNAL = ['plate_no', 'vin', 'contact', 'dealer_reg_no', 'presentation_no'];

    public static function cells(array $cells): array
    {
        foreach (self::INTERNAL as $k) {
            if (isset($cells[$k]['value'])) {
                $cells[$k]['value'] = self::mask($k, (string) $cells[$k]['value']);
                $cells[$k]['masked'] = true;
            }
        }
        return $cells;
    }

    public static function mask(string $key, string $v): string
    {
        return match ($key) {
            'plate_no' => preg_replace('/\d{4}$/u', '****', $v),
            'vin' => substr($v, 0, 3) . str_repeat('*', max(0, strlen($v) - 3)),
            'contact' => preg_replace('/^(\d{2,4})-?\d{3,4}-?(\d{4})$/', '$1-****-$2', $v),
            default => mb_substr($v, 0, 2) . '****',
        };
    }
}
