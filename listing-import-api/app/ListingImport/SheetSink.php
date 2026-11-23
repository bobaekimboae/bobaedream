<?php

namespace App\ListingImport;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Http;

/**
 * 매물 원장 시트(22_매물원장_데이터)에 한 줄 추가.
 * driver=google: 서비스 계정 키로 Sheets API values.append. driver=log: storage/app/sheet-rows.jsonl.
 */
class SheetSink
{
    public function append(array $row): void
    {
        $cfg = config('listing_import.sheet');
        if (($cfg['driver'] ?? 'log') !== 'google') {
            File::append(storage_path('app/sheet-rows.jsonl'), json_encode($row, JSON_UNESCAPED_UNICODE) . "\n");
            return;
        }
        $token = $this->accessToken($cfg['credentials']);
        $url = sprintf('https://sheets.googleapis.com/v4/spreadsheets/%s/values/%s:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS',
            $cfg['spreadsheet_id'], rawurlencode($cfg['range']));
        Http::withToken($token)->timeout(20)->retry(2, 500)->post($url, ['values' => [$row]])->throw();
    }

    private function accessToken(string $keyFile): string
    {
        $key = json_decode(File::get($keyFile), true);
        $now = time();
        $b64 = fn ($v) => rtrim(strtr(base64_encode(is_string($v) ? $v : json_encode($v)), '+/', '-_'), '=');
        $head = $b64(['alg' => 'RS256', 'typ' => 'JWT']);
        $claim = $b64(['iss' => $key['client_email'], 'scope' => 'https://www.googleapis.com/auth/spreadsheets',
            'aud' => 'https://oauth2.googleapis.com/token', 'iat' => $now, 'exp' => $now + 3000]);
        openssl_sign("$head.$claim", $sig, $key['private_key'], OPENSSL_ALGO_SHA256);
        $jwt = "$head.$claim." . $b64($sig);
        return Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $jwt,
        ])->throw()->json('access_token');
    }

    /** 시트 열 순서(scripts/listing_import/sheet_columns.json)대로 */
    public static function row(string $id, array $ledger): array
    {
        $cols = json_decode(File::get(base_path('../scripts/listing_import/sheet_columns.json')), true);
        $cells = $ledger['cells'] ?? [];
        $row = [$id];
        foreach (array_slice($cols, 1, -3) as $k) {
            $v = $cells[$k]['value'] ?? '';
            $row[] = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : $v;
        }
        return [...$row, '다른 사이트(' . ($ledger['site'] ?? '') . ')', '미확인', $ledger['checked_at'] ?? now()->toIso8601String()];
    }
}
