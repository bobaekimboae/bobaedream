<?php

use App\Models\ReleaseBundle;
use App\Models\ReleasePointer;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('never exposes a draft bundle as current configuration', function (): void {
    $user = User::query()->create(['name' => 'Test', 'email' => 'test@example.invalid', 'password' => 'not-a-real-secret', 'role' => 'super_admin']);
    $draft = ReleaseBundle::query()->create(['version' => 'test-draft', 'status' => 'DRAFT', 'manifest' => [], 'manifest_hash' => str_repeat('a', 64), 'created_by' => $user->id]);
    ReleasePointer::query()->create(['scope' => 'GLOBAL', 'current_release_bundle_id' => $draft->id]);
    $this->getJson('/api/v1/configuration/current')->assertStatus(503);
});

it('returns only an active published bundle with an etag', function (): void {
    $user = User::query()->create(['name' => 'Test', 'email' => 'test@example.invalid', 'password' => 'not-a-real-secret', 'role' => 'super_admin']);
    $hash = hash('sha256', 'manifest');
    $bundle = ReleaseBundle::query()->create(['version' => '2026.09.22.1', 'status' => 'PUBLISHED', 'manifest' => ['vehicle_types' => ['CAR']], 'manifest_hash' => $hash, 'created_by' => $user->id, 'published_by' => $user->id, 'published_at' => now()]);
    ReleasePointer::query()->create(['scope' => 'GLOBAL', 'current_release_bundle_id' => $bundle->id]);
    $this->getJson('/api/v1/configuration/current')->assertOk()->assertJsonPath('data.version', '2026.09.22.1')->assertHeader('etag');
});
