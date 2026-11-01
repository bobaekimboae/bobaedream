<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/** PUT /api/community/{board}/draft — payload 는 화면 상태 그대로(최대 64KB). 등록 때만 내용 검사를 한다. */
class SaveDraftRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'model_id' => ['required', 'string', Rule::exists('community_vehicle_models', 'id')],
            'model_name' => ['required', 'string', 'max:60'],
            'payload' => ['required', 'array', function ($attr, $value, $fail) {
                if (strlen(json_encode($value)) > 65536) $fail('임시저장 내용이 너무 길어요.');
            }],
        ];
    }
}
