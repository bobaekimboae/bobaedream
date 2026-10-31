<?php

namespace App\Shoot;

/**
 * 촬영 기록 저장소.
 * - meta: 처음 만들 때 한 번만 쓴다(소재지 · 역할 · 예정 장수).
 * - files: 실제로 올라간 파일(경로가 곧 칸 이름이라 따로 기록하지 않는다).
 * - submit: 등록하기를 누를 때 한 번 쓴다(올린 파일 목록).
 */
interface ShootStore
{
    public function create(string $id, array $meta): void;

    /** @return array|null meta */
    public function meta(string $id): ?array;

    /** @return list<array{pathname:string,url:string,size:int,uploadedAt:string}> */
    public function files(string $id): array;

    public function submit(string $id, array $manifest): void;

    public function submission(string $id): ?array;
}
