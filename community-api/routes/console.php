<?php

use App\Models\Upload;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Storage;

// 글에 붙지 않은 채 하루가 지난 파일(쓰다 그만둔 글 · 지운 사진)을 지운다. 임시저장에 든 파일은 남긴다.
Artisan::command('community:prune-uploads {--hours=24}', function () {
    $draftText = \App\Models\Draft::pluck('payload')->map(fn ($p) => json_encode($p))->implode("\n");
    $n = 0;
    Upload::whereNull('post_id')->where('created_at', '<', now()->subHours((int) $this->option('hours')))->each(function (Upload $u) use (&$n, $draftText) {
        if (str_contains($draftText, $u->id)) return;
        Storage::disk($u->disk)->delete(array_filter([$u->path, $u->cover_path]));
        $u->delete();
        $n++;
    });
    $this->info("지운 파일 {$n}개");
})->purpose('글에 붙지 않은 오래된 업로드 지우기');

Schedule::command('community:prune-uploads')->hourly();
