<?php

namespace App\Http\Requests;

use App\Community\RatingRules;
use App\Community\Sido;
use App\Models\Post;
use App\Models\VehicleModel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/** POST /api/community/review/posts — 차량 리뷰(懂车分) 등록 */
class StoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Post::class) ?? false;
    }

    public function rules(): array
    {
        $body = config('community.review_body');
        return [
            'model_id' => ['required', 'string', Rule::exists('community_vehicle_models', 'id')],
            'owner' => ['required', 'boolean'],
            'purchase' => ['nullable', 'array', 'required_if:owner,true'],
            'purchase.month' => ['required_with:purchase', 'regex:/^\d{4}\.(0[1-9]|1[0-2])$/'],
            'purchase.city' => ['required_with:purchase', Rule::in(Sido::ALL)],
            'purchase.price' => ['required_with:purchase', 'integer', 'between:1,1000000'], // 만원
            'purchase.paid' => ['nullable', 'integer', 'between:1,1000000'],
            'purchase.metric' => ['required_with:purchase', 'numeric', 'gt:0', 'max:3000'],
            'ratings' => ['required', 'array', 'min:1'],
            'body' => ['required', 'string', "min:{$body['min']}", "max:{$body['max']}"],
            'cover_upload_id' => ['nullable', 'string', 'max:64'],
        ];
    }

    /** 동력 방식별 별점 항목 · 0.5 단위 검사(규칙은 RatingRules 한 곳) */
    public function after(): array
    {
        return [function (Validator $v) {
            if ($v->errors()->isNotEmpty()) return;
            $vehicle = VehicleModel::find($this->input('model_id'));
            foreach (RatingRules::check($vehicle->powertrain, (array) $this->input('ratings')) as $field) {
                $v->errors()->add($field, '별점 항목이 올바르지 않아요.');
            }
        }];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['body' => trim((string) $this->input('body'))]);
    }
}
