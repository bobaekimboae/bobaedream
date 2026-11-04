<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PUT /api/community/{board}/draft — payload 는 화면 상태 그대로(최대 config community.draft_max_bytes). 사진 · 영상은 먼저 올리고 주소만 넣는다. 등록 때만 내용 검사를 한다. */
class SaveDraftRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            // 리뷰 · 연비는 차종이 있어야 임시저장된다. 글쓰기 키트(일상 · 질문 · 영상 · 긴 글 · 내 차 팔기 · 구매가)는 차종 없이도 된다.
            'model_id' => [in_array((string) ($this->route('board')?->value ?? $this->route('board')), ['review', 'fuel'], true) ? 'required' : 'nullable', 'string', Rule::exists('community_vehicle_models', 'id')],
            'model_name' => ['nullable', 'string', 'max:60'],
            'payload' => ['required', 'array', function ($attr, $value, $fail) {
                if (strlen(json_encode($value)) > config('community.draft_max_bytes', 65536)) $fail('임시저장 내용이 너무 길어요.');
            }],
        ];
    }
}
