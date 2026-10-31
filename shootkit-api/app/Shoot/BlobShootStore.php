<?php

namespace App\Shoot;

/** 임시 무료 서버용: 기록을 Blob에 JSON 파일로 둔다(DB 없이). */
class BlobShootStore implements ShootStore
{
    public function __construct(private BlobClient $blob)
    {
    }

    private function find(string $id, string $name): ?array
    {
        foreach ($this->blob->list("shoots/{$id}/{$name}") as $b) {
            if ($b['pathname'] === "shoots/{$id}/{$name}") {
                return $this->blob->getJson($b['url']);
            }
        }
        return null;
    }

    public function create(string $id, array $meta): void
    {
        $this->blob->putJson("shoots/{$id}/meta.json", $meta);
    }

    public function meta(string $id): ?array
    {
        return $this->find($id, 'meta.json');
    }

    public function files(string $id): array
    {
        $out = [];
        foreach ($this->blob->list("shoots/{$id}/") as $b) {
            if (preg_match('#^shoots/[^/]+/(photo|video)/#', $b['pathname'])) {
                $out[] = [
                    'pathname' => $b['pathname'],
                    'url' => $b['url'],
                    'size' => (int) ($b['size'] ?? 0),
                    'uploadedAt' => (string) ($b['uploadedAt'] ?? ''),
                ];
            }
        }
        usort($out, fn ($a, $b) => strcmp($a['pathname'], $b['pathname']));
        return $out;
    }

    public function submit(string $id, array $manifest): void
    {
        $this->blob->putJson("shoots/{$id}/submit.json", $manifest);
    }

    public function submission(string $id): ?array
    {
        return $this->find($id, 'submit.json');
    }
}
