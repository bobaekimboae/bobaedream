<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// PostgreSQL 15 기준. 글은 두 게시판이 한 표(community_posts)를 쓰고, 게시판마다 다른 값은 각자의 상세 표에 둔다.
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $t) {
                $t->id();
                $t->string('nickname', 20);
                $t->string('avatar')->default('community/assets/profile-avatars/avatar-01.svg');
                $t->string('email')->unique();
                $t->string('password');
                $t->timestamp('suspended_until')->nullable(); // 정지 중이면 쓰기 · 댓글 · 반응 막힘
                $t->boolean('is_moderator')->default(false);
                $t->timestamps();
            });
        }
        if (! Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $t) {
                $t->id();
                $t->morphs('tokenable');
                $t->text('name');
                $t->string('token', 64)->unique();
                $t->text('abilities')->nullable();
                $t->timestamp('last_used_at')->nullable();
                $t->timestamp('expires_at')->nullable()->index();
                $t->timestamps();
            });
        }

        // 차종 기준표(차량 고르기 목록과 같은 값). 글은 model_id 로 이 표를 가리킨다.
        Schema::create('community_vehicle_models', function (Blueprint $t) {
            $t->string('id', 64)->primary();
            $t->string('brand', 40);
            $t->string('model', 60);
            $t->string('trim', 120)->default('');
            $t->string('powertrain', 10); // ev · phev · erev · hybrid · ice
            $t->string('brand_logo')->default('');
            $t->string('photo')->default('');
            $t->string('segment', 40)->nullable(); // 「SUV 평균 4.36」의 차급
            $t->decimal('segment_score', 3, 2)->nullable();
        });

        Schema::create('community_posts', function (Blueprint $t) {
            $t->id();
            $t->string('board', 10); // review · fuel
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('model_id', 64);
            $t->foreign('model_id')->references('id')->on('community_vehicle_models');
            $t->string('title', 60)->default('');
            $t->text('body');
            $t->jsonb('images')->default('[]');
            $t->unsignedInteger('views')->default(0);
            $t->unsignedInteger('likes')->default(0);      // 반응 표를 세어 같이 맞춘다(목록 정렬용)
            $t->unsignedInteger('dislikes')->default(0);
            $t->unsignedInteger('comments')->default(0);
            $t->string('status', 10)->default('published'); // published · hidden(신고 처리) · deleted
            $t->timestamps();
            $t->softDeletes();
            $t->index(['board', 'status', 'created_at']);
            $t->index(['board', 'model_id', 'created_at']);
        });

        // 리뷰 상세: 오너 여부 · 구매 정보 · 별점(항목별) · 평균
        Schema::create('community_review_details', function (Blueprint $t) {
            $t->foreignId('post_id')->primary()->constrained('community_posts')->cascadeOnDelete();
            $t->boolean('owner')->default(false);
            $t->string('purchase_month', 7)->nullable(); // 2026.10
            $t->string('purchase_city', 10)->nullable();
            $t->unsignedInteger('purchase_price')->nullable(); // 만원
            $t->unsignedInteger('purchase_paid')->nullable();  // 실구매가(만원, 선택)
            $t->decimal('purchase_metric', 7, 1)->nullable();  // km 또는 km/L
            $t->jsonb('ratings');                              // {"exterior":4.5,...}
            $t->decimal('rating', 3, 2);
        });

        // 연비 상세: 지역 · 누적 주행 · 연비 · 전비 · 완충 주행거리 · 측정 온도
        Schema::create('community_fuel_details', function (Blueprint $t) {
            $t->foreignId('post_id')->primary()->constrained('community_posts')->cascadeOnDelete();
            $t->string('city', 10);
            $t->unsignedInteger('odometer_km')->nullable();
            $t->decimal('fuel_km_per_l', 5, 1)->nullable();
            $t->decimal('energy_km_per_kwh', 5, 1)->nullable();
            $t->unsignedInteger('full_charge_km')->nullable();
            $t->smallInteger('temperature_c')->nullable();
        });

        Schema::create('community_comments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('post_id')->constrained('community_posts')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('parent_id')->nullable()->constrained('community_comments')->cascadeOnDelete(); // 답글
            $t->string('body', 500);
            $t->string('region', 10)->default('');
            $t->unsignedInteger('likes')->default(0);
            $t->timestamps();
            $t->softDeletes();
            $t->index(['post_id', 'created_at']);
        });

        // 반응: 공감 · 비공감은 한 사람 한 글에 하나(서로 바뀜), 즐겨찾기는 따로
        Schema::create('community_reactions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('post_id')->constrained('community_posts')->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('kind', 10); // like · dislike · bookmark
            $t->timestamp('created_at')->useCurrent();
            $t->unique(['post_id', 'user_id', 'kind']);
        });

        // 임시저장: 게시판마다 한 사람 1건(원본 「发现您有○○的懂车分草稿」). payload 는 화면 상태 그대로.
        Schema::create('community_drafts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('board', 10);
            $t->string('model_id', 64);
            $t->string('model_name', 60);
            $t->jsonb('payload');
            $t->timestamps();
            $t->unique(['user_id', 'board']);
        });

        Schema::create('community_follows', function (Blueprint $t) {
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('target_id')->constrained('users')->cascadeOnDelete();
            $t->timestamp('created_at')->useCurrent();
            $t->primary(['user_id', 'target_id']);
        });
    }

    public function down(): void
    {
        foreach (['community_follows', 'community_drafts', 'community_reactions', 'community_comments', 'community_fuel_details', 'community_review_details', 'community_posts', 'community_vehicle_models'] as $t) {
            Schema::dropIfExists($t);
        }
    }
};
