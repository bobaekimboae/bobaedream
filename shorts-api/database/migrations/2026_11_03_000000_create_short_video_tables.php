<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 비디오 투어 부위 시각(매물 영상 하나에 여러 부위)
        Schema::create('short_video_chapters', function (Blueprint $t) {
            $t->id();
            $t->string('car_public_id', 32)->index();
            $t->string('video_url', 512);
            $t->string('chapter_key', 32);
            $t->decimal('from_sec', 8, 2);
            $t->decimal('to_sec', 8, 2);
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
        });
        // 숏폼 시청 기록(같은 사람 30분 안 중복은 한 번)
        Schema::create('short_video_views', function (Blueprint $t) {
            $t->id();
            $t->string('car_public_id', 32);
            $t->string('viewer_hash', 64);
            $t->decimal('watched_sec', 8, 2)->default(0);
            $t->timestamps();
            $t->index(['car_public_id', 'viewer_hash', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('short_video_views');
        Schema::dropIfExists('short_video_chapters');
    }
};
