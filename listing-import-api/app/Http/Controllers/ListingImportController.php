<?php

namespace App\Http\Controllers;

use App\Jobs\RunListingImport;
use App\ListingImport\ImportError;
use App\ListingImport\Masker;
use App\ListingImport\Sites;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ListingImportController extends Controller
{
    private static function j(array $data, int $status = 200): JsonResponse
    {
        return response()->json($data, $status, [], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    public function health(): JsonResponse
    {
        return self::j(['ok' => true, 'sites' => array_values(Sites::NAMES), 'complex_sites' => count(Sites::registry())]);
    }

    /** POST /listing-imports  딜러가 붙여 넣은 링크 1개 접수 */
    public function store(Request $r): JsonResponse
    {
        $this->auth($r);
        $in = $r->validate([
            'url' => ['required', 'url:https,http', 'max:500'],
            'dealer_key' => ['required', 'string', 'max:64'],
            'dealer_name' => ['nullable', 'string', 'max:30'],
            'shop_name' => ['nullable', 'string', 'max:60'],
        ]);
        $site = Sites::detect($in['url']);
        if (! $site) {
            throw new ImportError('지원하지 않는 사이트예요. 엔카·차란차·엠파크·코리아카마켓 또는 전국 조합·매매단지 홈페이지의 매물 링크를 넣어 주세요.', 'unsupported_site', 422);
        }
        $key = hash('sha256', $in['dealer_key'] . '|' . Sites::normalize($in['url']));
        $existing = DB::table('listing_imports')->where('request_key', $key)->first();
        if ($existing) {
            // 같은 딜러·같은 매물은 한 줄. 이미 있으면 그 결과를 돌려준다(mobile.de 방식)
            return self::j(['ok' => true, 'existing' => true, 'data' => $this->present($existing)], 200);
        }
        $id = (string) Str::uuid();
        DB::table('listing_imports')->insert([
            'id' => $id, 'request_key' => $key, 'dealer_key' => $in['dealer_key'],
            'dealer_name' => $in['dealer_name'] ?? null, 'shop_name' => $in['shop_name'] ?? null,
            'site' => $site, 'url' => $in['url'], 'status' => 'queued', 'created_at' => now(), 'updated_at' => now(),
        ]);
        RunListingImport::dispatch($id);
        $row = DB::table('listing_imports')->where('id', $id)->first();
        return self::j(['ok' => true, 'existing' => false, 'data' => $this->present($row)], 202);
    }

    /** GET /listing-imports/{id}  진행 상태·원장·사진 */
    public function show(Request $r, string $id): JsonResponse
    {
        $this->auth($r);
        return self::j(['ok' => true, 'data' => $this->present($this->find($id))]);
    }

    /** POST /listing-imports/{id}/recheck  가격·판매 상태 다시 확인 */
    public function recheck(Request $r, string $id): JsonResponse
    {
        $this->auth($r);
        $row = $this->find($id);
        if ($row->checked_at && now()->diffInHours($row->checked_at, true) < 1) {
            throw new ImportError('방금 확인했어요. 잠시 뒤 다시 눌러 주세요.', 'too_soon', 429);
        }
        DB::table('listing_imports')->where('id', $id)->update(['status' => 'queued', 'updated_at' => now()]);
        RunListingImport::dispatch($id);
        return self::j(['ok' => true, 'data' => $this->present($this->find($id))], 202);
    }

    /** GET /dealers/{dealerKey}/listings  흩어진 매물: 같은 차는 한 줄, 사이트별 가격 */
    public function dealerListings(Request $r, string $dealerKey): JsonResponse
    {
        $this->auth($r);
        $rows = DB::table('listing_imports')->where('dealer_key', $dealerKey)->whereIn('status', ['done', 'needs_review'])->orderBy('created_at')->get();
        $groups = [];
        foreach ($rows as $row) {
            $g = $row->car_key ?: 'single:' . $row->id;
            $l = json_decode((string) $row->ledger, true) ?: [];
            $c = $l['cells'] ?? [];
            $groups[$g] ??= [
                'car' => trim(implode(' ', array_filter([$c['make']['value'] ?? null, $c['model']['value'] ?? null, $c['trim']['value'] ?? null]))),
                'year' => $c['year']['value'] ?? null, 'mileage_km' => $c['mileage_km']['value'] ?? null,
                'catalog' => $l['catalog'] ?? null, 'sites' => [],
            ];
            $groups[$g]['sites'][] = [
                'import_id' => $row->id, 'site' => Sites::label($row->site, $row->url), 'url' => $row->url,
                'price_krw' => $c['price_krw']['value'] ?? null, 'price_display' => $c['price_display']['value'] ?? null,
                'status' => $row->listing_status, 'checked_at' => $row->checked_at, 'owner_check' => $row->owner_check,
            ];
        }
        $out = array_values(array_map(function ($g) {
            $prices = array_filter(array_column($g['sites'], 'price_krw'));
            $g['price_gap_krw'] = count($prices) > 1 ? max($prices) - min($prices) : 0;
            return $g;
        }, $groups));
        return self::j(['ok' => true, 'data' => $out, 'total_cars' => count($out), 'total_links' => count($rows)]);
    }

    private function present(object $row): array
    {
        $ledger = json_decode((string) $row->ledger, true);
        return [
            'id' => $row->id, 'site' => Sites::label($row->site, $row->url), 'url' => $row->url,
            'status' => $row->status, 'owner_check' => $row->owner_check,
            'error' => $row->error ? ['code' => $row->error_code, 'message' => $row->error] : null,
            'cells' => $ledger ? Masker::cells($ledger['cells'] ?? []) : null,
            'note' => $ledger['note'] ?? null,
            'catalog' => $ledger['catalog'] ?? null,          // 보배드림 차량 기준표 연결(제조사·모델·세대 id)
            'source' => $ledger['source_meta'] ?? null,       // 조합·매매단지: 사이트·전산·조합·연합회
            'photos' => json_decode((string) $row->photos, true) ?: [],
            'checked_at' => $row->checked_at, 'sheet_synced' => (bool) $row->sheet_synced_at,
        ];
    }

    private function find(string $id): object
    {
        if (! Str::isUuid($id)) {
            throw new ImportError('가져오기 번호가 올바르지 않아요.', 'invalid', 422);
        }
        return DB::table('listing_imports')->where('id', $id)->first() ?? throw new ImportError('가져오기를 찾지 못했어요.', 'not_found', 404);
    }

    /** 보배드림 본 서버만 부른다(서비스 토큰). 딜러 로그인 확인은 본 서버가 하고 dealer_key 를 넘김 */
    private function auth(Request $r): void
    {
        $t = (string) config('listing_import.service_token');
        if ($t === '' || ! hash_equals($t, (string) $r->bearerToken())) {
            throw new ImportError('권한이 없어요.', 'unauthorized', 401);
        }
    }
}
