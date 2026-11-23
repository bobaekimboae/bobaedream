<?php

namespace App\ListingImport;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;

/** Python 추출 일꾼(scripts/listing_import/run.py)을 실행하고 결과를 읽는다 */
class Worker
{
    /** @return array{ledger: array, photos: array} */
    public function run(string $importId, string $url, ?string $dealer, ?string $shop): array
    {
        $dir = rtrim(config('listing_import.work_dir'), '/') . '/' . $importId;
        File::ensureDirectoryExists($dir);
        $cmd = [config('listing_import.python'), config('listing_import.worker'), $url, '--out', $dir];
        if ($dealer) { array_push($cmd, '--dealer', $dealer); }
        if ($shop) { array_push($cmd, '--shop', $shop); }

        $res = Process::timeout(config('listing_import.timeout'))->run($cmd);
        if (! $res->successful()) {
            throw new ImportError('추출 일꾼이 실패했어요.', 'worker_failed', 502);
        }
        $line = collect(explode("\n", trim($res->output())))->filter()->last();
        $summary = json_decode((string) $line, true) ?: [];
        if (isset($summary['error'])) {
            throw new ImportError((string) $summary['error'], 'extract_failed', 422);
        }
        $ledgerFile = "$dir/{$summary['key']}/ledger.json";
        if (! is_file($ledgerFile)) {
            throw new ImportError('원장 파일을 만들지 못했어요.', 'no_ledger', 502);
        }
        $ledger = json_decode(File::get($ledgerFile), true);

        // 사진: 원본 그대로 저장 디스크로 옮긴다
        $photos = [];
        $disk = Storage::disk(config('listing_import.photo_disk'));
        foreach ($ledger['photos_saved'] ?? [] as $p) {
            if (! isset($p['file'])) { continue; }
            $src = "$dir/{$summary['key']}/photos/{$p['file']}";
            $dest = "listing-imports/$importId/{$p['file']}";
            $disk->put($dest, File::get($src));
            $photos[] = ['order' => $p['order'], 'path' => $dest, 'bytes' => $p['bytes'], 'sha256' => $p['sha256']];
        }
        unset($ledger['photos_saved'], $ledger['photo_urls']);
        File::deleteDirectory($dir);
        return ['ledger' => $ledger, 'photos' => $photos];
    }
}
