<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// 리뉴얼 운영용(PostgreSQL 15). 임시 무료 서버(SHOOT_STORE=blob)에서는 쓰지 않는다.
return new class extends Migration {
    public function up(): void
    {
        Schema::create('shoots', function (Blueprint $t) {
            $t->ulid('id')->primary();
            $t->string('role', 16);              // dealer | crew
            $t->string('region_sido', 16);
            $t->string('region_gugun', 32)->nullable();
            $t->unsignedSmallInteger('planned_photos');
            $t->unsignedSmallInteger('planned_videos');
            $t->string('client', 32)->nullable(); // 화면 판 이름
            $t->jsonb('items')->nullable();       // 파일 번호별 칸 이름
            $t->timestampTz('submitted_at')->nullable();
            $t->jsonb('manifest')->nullable();    // 등록할 때 올린 파일 목록
            $t->timestampsTz();
        });
        Schema::create('shoot_files', function (Blueprint $t) {
            $t->id();
            $t->foreignUlid('shoot_id')->constrained()->cascadeOnDelete();
            $t->string('kind', 8);               // photo | video
            $t->string('pathname')->unique();
            $t->text('url');
            $t->unsignedBigInteger('size');
            $t->timestampTz('uploaded_at');
            $t->index(['shoot_id', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shoot_files');
        Schema::dropIfExists('shoots');
    }
};
