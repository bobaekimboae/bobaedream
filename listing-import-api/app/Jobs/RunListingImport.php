<?php

namespace App\Jobs;

use App\ListingImport\CarKey;
use App\ListingImport\ImportError;
use App\ListingImport\SheetSink;
use App\ListingImport\Worker;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\DB;
use Throwable;

/** 가져오기 1건 실행: 추출 → 사진 저장 → 원장 저장 → 시트 한 줄 */
class RunListingImport implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 2;
    public int $backoff = 60;

    public function __construct(public string $importId) {}

    public function uniqueId(): string
    {
        return $this->importId;
    }

    public function handle(Worker $worker, SheetSink $sheet): void
    {
        $row = DB::table('listing_imports')->where('id', $this->importId)->first();
        if (! $row) { return; }
        DB::table('listing_imports')->where('id', $row->id)->update(['status' => 'running', 'attempts' => $row->attempts + 1, 'updated_at' => now()]);

        try {
            $out = $worker->run($row->id, $row->url, $row->dealer_name, $row->shop_name);
        } catch (ImportError $e) {
            $this->fail_($row->id, $e->codeName, $e->getMessage());
            return;
        } catch (Throwable $e) {
            $this->fail_($row->id, 'internal', '가져오는 중 오류가 났어요.');
            report($e);
            return;
        }

        $ledger = $out['ledger'];
        $owner = $ledger['owner_check'] ?? '미판정';
        $cells = $ledger['cells'] ?? [];
        DB::table('listing_imports')->where('id', $row->id)->update([
            'status' => $owner === '확인 필요' ? 'needs_review' : 'done',
            'owner_check' => $owner,
            'ledger' => json_encode($ledger, JSON_UNESCAPED_UNICODE),
            'photos' => json_encode($out['photos'], JSON_UNESCAPED_UNICODE),
            'car_key' => CarKey::of($cells, $ledger['catalog'] ?? []),
            'listing_status' => $cells['status']['value'] ?? '판매중',
            'error_code' => null, 'error' => null,
            'checked_at' => now(), 'updated_at' => now(),
        ]);

        // 본인 매물로 확인된 것만 원장 시트로(확인 필요는 사람이 승인한 뒤)
        if ($owner !== '확인 필요') {
            try {
                $sheet->append(SheetSink::row($row->id, $ledger));
                DB::table('listing_imports')->where('id', $row->id)->update(['sheet_synced_at' => now()]);
            } catch (Throwable $e) {
                report($e); // 시트 실패는 가져오기 결과를 지우지 않는다(다음 재확인 때 다시)
            }
        }
    }

    private function fail_(string $id, string $code, string $msg): void
    {
        DB::table('listing_imports')->where('id', $id)->update(['status' => 'failed', 'error_code' => $code, 'error' => $msg, 'updated_at' => now()]);
    }
}
