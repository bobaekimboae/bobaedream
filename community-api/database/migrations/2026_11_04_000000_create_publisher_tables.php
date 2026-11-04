<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 동처띠 글쓰기 키트 6개 글 종류(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가). 글은 같은 표(community_posts)를 쓰고,
// 내 차 팔기 · 구매가처럼 검색 · 통계에 쓸 값은 각자의 상세 표에 숫자로 둔다(Meilisearch 패싯 · 차종별 평균 대비).
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('community_posts', function (Blueprint $t) {
            $t->string('model_id', 64)->nullable()->change(); // 일상 · 질문 · 영상 · 긴 글은 차종이 없을 수 있다
            $t->string('topic', 40)->nullable();   // 화제(话题)
            $t->string('circle', 30)->nullable();  // 차량 모임(圈子)
            $t->string('claim', 30)->nullable();   // 내용 성격 표시(内容自主声明)
            $t->string('city', 20)->nullable();    // 위치 · 지역
            $t->jsonb('media')->default('[]');     // [{upload_id, kind, url, cover_url, width, height, duration}] 순서 = 화면 순서
            $t->jsonb('attach')->nullable();       // 일상 · 긴 글에 끼운 구매가 카드 · 부품 카드(owner_price · parts)
        });

        // 올린 사진 · 영상. 글에 붙기 전에는 post_id 가 비어 있고, 하루가 지나도록 안 붙으면 지운다(community:prune-uploads).
        Schema::create('community_uploads', function (Blueprint $t) {
            $t->uuid('id')->primary();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('post_id')->nullable()->constrained('community_posts')->nullOnDelete();
            $t->string('kind', 6);        // image · video
            $t->string('purpose', 10);    // post(공개) · receipt(구매가 영수증, 심사용 비공개)
            $t->string('disk', 10);
            $t->string('path');
            $t->string('cover_path')->nullable(); // 영상 표지
            $t->string('mime', 40);
            $t->unsignedBigInteger('bytes');
            $t->unsignedInteger('width')->nullable();
            $t->unsignedInteger('height')->nullable();
            $t->unsignedInteger('duration_ms')->nullable();
            $t->timestamps();
            $t->index(['user_id', 'created_at']);
        });

        // 내 차 팔기: 등록 연월 · 주행거리 · 색상 · 소유자 변경 · 희망 판매가(만원)
        Schema::create('community_sell_details', function (Blueprint $t) {
            $t->foreignId('post_id')->primary()->constrained('community_posts')->cascadeOnDelete();
            $t->string('reg_month', 7);          // 2021.03
            $t->unsignedInteger('odometer_km');
            $t->string('color', 10);
            $t->unsignedTinyInteger('owner_changes');
            $t->unsignedInteger('price_manwon');
            $t->index(['price_manwon']);
        });

        // 구매가: 차량가 · 실구매가(만원, 소수 둘째 자리) · 구매 시기 · 지역 · 결제 방식 · 대리점 · 혜택
        Schema::create('community_price_details', function (Blueprint $t) {
            $t->foreignId('post_id')->primary()->constrained('community_posts')->cascadeOnDelete();
            $t->decimal('list_price', 9, 2);
            $t->decimal('paid_price', 9, 2);
            $t->string('purchase_month', 7);     // 2026.10
            $t->string('city', 20);
            $t->string('pay', 4)->nullable();    // full · loan
            $t->string('dealer', 30)->nullable();
            $t->string('gift', 40)->nullable();
            $t->uuid('receipt_upload_id')->nullable(); // 영수증(비공개, 심사용)
        });

        // 투표: 글마다 하나. 한 사람 한 번(복수 선택이면 여러 개), 마감 뒤에는 결과만.
        Schema::create('community_votes', function (Blueprint $t) {
            $t->foreignId('post_id')->primary()->constrained('community_posts')->cascadeOnDelete();
            $t->string('title', 30);
            $t->boolean('multi')->default(false);
            $t->jsonb('options');                // ["예", "아니요"]
            $t->timestamp('ends_at');
        });
        Schema::create('community_vote_ballots', function (Blueprint $t) {
            $t->id();
            $t->foreignId('post_id')->constrained('community_posts')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->jsonb('choices');                // [0, 2]
            $t->timestamp('created_at')->useCurrent();
            $t->unique(['post_id', 'user_id']);
        });

        Schema::table('community_drafts', function (Blueprint $t) {
            $t->string('model_id', 64)->nullable()->change();
            $t->string('model_name', 60)->nullable()->change();
        });
    }

    public function down(): void
    {
        foreach (['community_vote_ballots', 'community_votes', 'community_price_details', 'community_sell_details', 'community_uploads'] as $t) {
            Schema::dropIfExists($t);
        }
        Schema::table('community_posts', fn (Blueprint $t) => $t->dropColumn(['topic', 'circle', 'claim', 'city', 'media', 'attach']));
    }
};
