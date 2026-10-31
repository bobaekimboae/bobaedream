<?php

namespace App\Shoot;

use Illuminate\Support\Facades\Http;

/**
 * Vercel Blob REST API (@vercel/blob 1.x와 같은 요청 모양).
 * 읽기·쓰기 토큰은 서버 환경 변수에만 있고 화면에는 내보내지 않는다.
 */
class BlobClient
{
    public function __construct(private array $cfg)
    {
    }

    public function configured(): bool
    {
        return is_string($this->cfg['token'] ?? null) && str_starts_with($this->cfg['token'], 'vercel_blob_rw_');
    }

    private function token(): string
    {
        if (!$this->configured()) {
            throw new ShootError('업로드 저장소가 아직 연결되지 않았어요.', 503, 'storage_missing');
        }
        return $this->cfg['token'];
    }

    public function storeId(): string
    {
        return explode('_', $this->token())[3] ?? '';
    }

    private function http()
    {
        return Http::withHeaders([
            'authorization' => 'Bearer ' . $this->token(),
            'x-api-version' => $this->cfg['version'],
        ])->timeout(10)->retry(2, 300, throw: false);
    }

    /** 서버가 직접 작은 JSON을 쓴다(덮어쓰기 없음 · 이름 그대로). */
    public function putJson(string $pathname, array $data): array
    {
        $res = $this->http()
            ->withHeaders([
                'x-add-random-suffix' => '0',
                'x-content-type' => 'application/json',
                'x-cache-control-max-age' => '60',
            ])
            ->withBody(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), 'application/json')
            ->put($this->cfg['api'] . '/?' . http_build_query(['pathname' => $pathname]));
        if (!$res->successful()) {
            throw new ShootError('기록을 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요.', 502, 'storage_write');
        }
        return $res->json();
    }

    /** @return list<array> */
    public function list(string $prefix): array
    {
        $out = [];
        $cursor = null;
        do {
            $q = ['prefix' => $prefix, 'limit' => 1000] + ($cursor ? ['cursor' => $cursor] : []);
            $res = $this->http()->get($this->cfg['api'] . '/?' . http_build_query($q));
            if (!$res->successful()) {
                throw new ShootError('기록을 읽지 못했어요. 잠시 뒤 다시 시도해 주세요.', 502, 'storage_read');
            }
            $body = $res->json();
            array_push($out, ...($body['blobs'] ?? []));
            $cursor = ($body['hasMore'] ?? false) ? ($body['cursor'] ?? null) : null;
        } while ($cursor);
        return $out;
    }

    public function getJson(string $url): ?array
    {
        $res = Http::timeout(10)->get($url);
        return $res->successful() ? $res->json() : null;
    }

    /**
     * 폰이 Blob으로 바로 올릴 때 쓰는 허가표(client token).
     * 모양: vercel_blob_client_{storeId}_{base64(hmacHex(payload) . "." . payload)}
     */
    public function clientToken(array $args): string
    {
        $rw = $this->token();
        $payload = base64_encode(json_encode($args, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        $sig = hash_hmac('sha256', $payload, $rw);
        return 'vercel_blob_client_' . $this->storeId() . '_' . base64_encode($sig . '.' . $payload);
    }

    /** 공개 파일 주소가 이 저장소 것인지 */
    public function ownsUrl(string $url): bool
    {
        $host = parse_url($url, PHP_URL_HOST) ?: '';
        return strtolower($host) === strtolower($this->storeId()) . '.public.blob.vercel-storage.com';
    }
}
