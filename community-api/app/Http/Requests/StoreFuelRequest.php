<?php

namespace App\Http\Requests;

use App\Community\Sido;
use App\Models\Post;
use App\Models\VehicleModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** POST /api/community/fuel/posts — 연비 · 전비 기록(车主续航 能耗分享) 등록 */
class StoreFuelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Post::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'model_id' => ['required', 'string', Rule::exists('community_vehicle_models', 'id')],
            'title' => ['nullable', 'string', 'max:30'],
            'body' => ['required', 'string', 'min:1', 'max:' . config('community.fuel_body.max')],
            'city' => ['required', Rule::in(Sido::ALL)],
            'odometer_km' => ['nullable', 'integer', 'between:0,2000000'],
            'fuel_km_per_l' => ['nullable', 'numeric', 'between:0.1,99.9'],
            'energy_km_per_kwh' => ['nullable', 'numeric', 'between:0.1,30'],
            'full_charge_km' => ['nullable', 'integer', 'between:1,2000'],
            'temperature_c' => ['nullable', 'integer', 'between:-40,60'],
            'upload_ids' => ['nullable', 'array', 'max:9'],
            'upload_ids.*' => ['string', 'max:64'],
        ];
    }

    /** 동력 방식에 없는 값은 받지 않는다: 내연 · 하이브리드 = 연비만, 전기 = 전비 · 완충 주행거리 · 온도, 플러그인 · 연장형 = 둘 다 */
    public function after(): array
    {
        return [function (Validator $v) {
            if ($v->errors()->isNotEmpty()) return;
            $pt = VehicleModel::find($this->input('model_id'))->powertrain;
            $hasFuel = in_array($pt, ['ice', 'hybrid', 'phev', 'erev'], true);
            $hasEnergy = in_array($pt, ['ev', 'phev', 'erev'], true);
            $isEv = $pt === 'ev';
            foreach (['fuel_km_per_l' => $hasFuel, 'energy_km_per_kwh' => $hasEnergy, 'full_charge_km' => $isEv, 'temperature_c' => $isEv] as $k => $allowed) {
                if (! $allowed && $this->filled($k)) $v->errors()->add($k, '이 차종에는 쓰지 않는 값이에요.');
            }
        }];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['body' => trim((string) $this->input('body')), 'title' => trim((string) $this->input('title')) ?: null]);
    }
}
