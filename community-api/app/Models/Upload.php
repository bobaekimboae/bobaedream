<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

/** 올린 사진 · 영상. 공개 파일 주소의 파일 이름이 곧 id 라서(…/{id}.jpg) 화면은 주소만 들고 있어도 된다. */
class Upload extends Model
{
    use HasUuids;

    protected $table = 'community_uploads';
    protected $guarded = [];

    public function url(): ?string
    {
        return $this->purpose === 'receipt' ? null : Storage::disk($this->disk)->url($this->path);
    }

    public function coverUrl(): ?string
    {
        return $this->cover_path ? Storage::disk($this->disk)->url($this->cover_path) : null;
    }

    /** 글에 저장하는 모양(community_posts.media 한 칸) */
    public function toMedia(): array
    {
        return array_filter([
            'upload_id' => $this->id, 'kind' => $this->kind, 'url' => $this->url(), 'cover_url' => $this->coverUrl(),
            'width' => $this->width, 'height' => $this->height, 'duration' => $this->duration_ms ? round($this->duration_ms / 1000, 1) : null,
        ], fn ($v) => $v !== null);
    }
}
