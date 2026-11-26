<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 링크 1개 = 가져오기 1건. 같은 딜러·같은 링크는 한 줄(request_key 로 중복 방지)
        Schema::create('listing_imports', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->string('request_key', 64)->unique();         // sha256(딜러키 + 정규화 링크)
            $t->string('dealer_key', 64)->index();           // 보배드림 딜러 계정 키
            $t->string('dealer_name', 60)->nullable();
            $t->string('shop_name', 80)->nullable();
            $t->string('site', 30);
            $t->text('url');
            $t->string('status', 20)->default('queued');     // queued | running | done | needs_review | failed
            $t->string('owner_check', 20)->nullable();       // 본인 매물 | 확인 필요 | 미판정
            $t->string('error_code', 40)->nullable();
            $t->text('error')->nullable();
            $t->json('ledger')->nullable();                  // 원장 칸(차량번호·연락처 포함, 내부 전용)
            $t->json('photos')->nullable();                  // [{order, path, bytes, sha256}]
            $t->string('car_key', 64)->nullable()->index();  // 같은 차 묶기 키(sha256)
            $t->string('listing_status', 20)->nullable();    // 판매중 | 판매완료 | 사라짐
            $t->unsignedInteger('attempts')->default(0);
            $t->timestamp('checked_at')->nullable();
            $t->timestamp('sheet_synced_at')->nullable();
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('listing_imports');
    }
};
