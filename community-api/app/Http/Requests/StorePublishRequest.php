<?php

namespace App\Http\Requests;

use App\Community\Board;
use App\Models\Post;
use App\Models\Upload;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

/**
 * POST /api/community/{dynamic|ask|video|long|sell|price}/posts — 동처띠 글쓰기 키트 등록.
 * 화면(nuxt-review/app/components/pub/*Write.vue)이 막는 조건을 서버가 한 번 더 검사한다. 제한값 = config('community.publish').
 * media 는 먼저 POST /uploads 로 올린 파일 id 를 화면 순서대로 보낸다(첫 장 = 대표).
 */
class StorePublishRequest extends FormRequest
{
    public const CLAIMS = ['AI로 만든 내용 포함', '꾸며 낸 연출 포함', '광고 · 홍보 내용 포함', '개인 의견, 참고만', '표시 필요 없음'];
    public const COLORS = ['흰색', '검정', '진회색', '은회색', '갈색', '빨강', '파랑', '샴페인', '주황', '노랑', '초록', '보라', '기타'];
    public const PART_TYPES = ['휠', '타이어', '브레이크', '서스펜션', '배기', '랩핑', '직접 입력'];
    public const VOTE_DAYS = [1, 3, 7, 30];

    private ?Board $boardCache = null;

    public function board(): Board
    {
        $r = $this->route('board');
        return $this->boardCache ??= $r instanceof Board ? $r : Board::from((string) $r);
    }

    public function authorize(): bool
    {
        return $this->user()?->can('create', Post::class) ?? false;
    }

    public function rules(): array
    {
        $b = $this->board();
        $c = config('community.publish.' . $b->value);
        $month = ['string', 'regex:/^(19|20)\d{2}\.(0[1-9]|1[0-2])$/'];
        $money = ['numeric', 'between:0.01,9999999', 'regex:/^\d+(\.\d{1,2})?$/'];
        $rules = [
            'title' => ['nullable', 'string', 'max:' . ($c['title'] ?? 60)],
            'body' => ['nullable', 'string', 'max:' . ($c['body'] ?? $c['note'] ?? 2000)],
            'media' => ['nullable', 'array', 'max:' . ($c['images'] ?? 1)],
            'media.*' => ['string', 'uuid', 'distinct'],
            'topic' => ['nullable', 'string', 'max:40'],
            'circle' => ['nullable', 'string', 'max:30'],
            'claim' => ['nullable', Rule::in(self::CLAIMS)],
            'city' => ['nullable', 'string', 'max:20'],
            'model_id' => [$b->needsVehicle() ? 'required' : 'nullable', 'string', Rule::exists('community_vehicle_models', 'id')],
        ];
        if (in_array($b, [Board::Dynamic, Board::Ask], true)) {
            $rules += [
                'vote' => ['nullable', 'array'],
                'vote.title' => ['required_with:vote', 'string', 'max:30'],
                'vote.multi' => ['boolean'],
                'vote.options' => ['required_with:vote', 'array', 'min:2', 'max:10'],
                'vote.options.*' => ['string', 'min:1', 'max:20', 'distinct'],
                'vote.ends_in_days' => ['required_with:vote', 'integer', Rule::in(self::VOTE_DAYS)],
            ];
        }
        if (in_array($b, [Board::Dynamic, Board::Long], true)) {
            $rules += [
                'owner_price' => ['nullable', 'array'],
                'owner_price.model_id' => ['required_with:owner_price', 'string', Rule::exists('community_vehicle_models', 'id')],
                'owner_price.month' => ['required_with:owner_price', ...$month],
                'owner_price.list_price' => ['required_with:owner_price', ...$money],
                'owner_price.paid_price' => ['required_with:owner_price', ...$money],
                'owner_price.city' => ['nullable', 'string', 'max:20'],
            ];
        }
        if ($b === Board::Long) {
            $rules += [
                'parts' => ['nullable', 'array', 'max:' . $c['parts']],
                'parts.*.type' => ['required', Rule::in(self::PART_TYPES)],
                'parts.*.brand' => ['required', 'string', 'max:40'],
                'parts.*.metric' => ['nullable', 'string', 'max:40'],
                'parts.*.price' => ['nullable', 'string', 'max:20'],
            ];
        }
        if ($b === Board::Sell) {
            $rules += [
                'sell' => ['required', 'array'],
                'sell.reg_month' => ['required', ...$month],
                'sell.odometer_km' => ['required', 'integer', 'between:0,2000000'],
                'sell.color' => ['required', Rule::in(self::COLORS)],
                'sell.owner_changes' => ['required', 'integer', 'between:0,30'],
                'sell.price_manwon' => ['required', 'integer', 'between:1,10000000'],
            ];
        }
        if ($b === Board::Price) {
            $rules += [
                'price' => ['required', 'array'],
                'price.list_price' => ['required', ...$money],
                'price.paid_price' => ['required', ...$money],
                'price.purchase_month' => ['required', ...$month],
                'price.city' => ['required', 'string', 'max:20'],
                'price.pay' => ['nullable', 'in:full,loan'],
                'price.dealer' => ['nullable', 'string', 'max:30'],
                'price.gift' => ['nullable', 'string', 'max:40'],
                'price.receipt_upload_id' => ['nullable', 'uuid'],
            ];
        }
        return $rules;
    }

    /** 글 종류별 조건: 사진 · 영상 종류와 장수, 필수 글, 가격 비율, 올린 사람 확인 */
    public function after(): array
    {
        return [function (Validator $v) {
            if ($v->errors()->isNotEmpty()) return;
            $b = $this->board();
            $c = config('community.publish.' . $b->value);
            $ids = array_values($this->input('media', []) ?? []);
            $uploads = Upload::whereIn('id', $ids)->get()->keyBy('id');
            foreach ($ids as $i => $id) {
                $u = $uploads[$id] ?? null;
                if (! $u || $u->user_id !== $this->user()->id || $u->purpose !== 'post') { $v->errors()->add("media.$i", '올리지 않은 파일이에요.'); return; }
                if ($u->post_id) { $v->errors()->add("media.$i", '이미 다른 글에 쓴 파일이에요.'); return; }
            }
            $images = $uploads->where('kind', 'image')->count();
            $videos = $uploads->where('kind', 'video')->count();
            $title = trim((string) $this->input('title'));
            $body = trim((string) $this->input('body'));
            $len = fn (string $s) => mb_strlen($s);
            match ($b) {
                Board::Dynamic => (function () use ($v, $videos, $images, $body) {
                    if ($videos) $v->errors()->add('media', '일상 글에는 사진만 올릴 수 있어요.');
                    if (! $images && $body === '') $v->errors()->add('body', '사진을 올리거나 본문을 써 주세요.');
                })(),
                Board::Ask => (function () use ($v, $videos, $images, $body, $c, $len) {
                    if ($videos > 1 || ($videos && $images)) $v->errors()->add('media', '질문에는 사진 여러 장 또는 영상 하나를 올릴 수 있어요.');
                    if ($len($body) < $c['body_min']) $v->errors()->add('body', "질문을 {$c['body_min']}자 이상 써 주세요.");
                })(),
                Board::Video => (function () use ($v, $videos, $images, $title) {
                    if ($videos !== 1 || $images) $v->errors()->add('media', '영상 하나를 올려 주세요.');
                    if ($title === '') $v->errors()->add('title', '제목을 써 주세요.');
                })(),
                Board::Long => (function () use ($v, $videos, $images, $title, $body) {
                    if ($videos) $v->errors()->add('media', '긴 글에는 사진만 넣을 수 있어요.');
                    if ($title === '') $v->errors()->add('title', '제목을 써 주세요.');
                    if (! $images && $body === '') $v->errors()->add('body', '본문을 써 주세요.');
                })(),
                Board::Sell => (function () use ($v, $videos, $images, $c) {
                    if ($videos) $v->errors()->add('media', '차량 사진만 올릴 수 있어요.');
                    if ($images < $c['images_min']) $v->errors()->add('media', '실제 차량 사진을 1장 이상 올려 주세요.');
                    if ((int) substr((string) $this->input('sell.reg_month'), 0, 4) > (int) now()->format('Y')) $v->errors()->add('sell.reg_month', '등록 연월이 올바르지 않아요.');
                })(),
                Board::Price => (function () use ($v, $ids, $c) {
                    if ($ids) $v->errors()->add('media', '구매가 글에는 사진을 붙이지 않아요.');
                    $list = (float) $this->input('price.list_price');
                    if ((float) $this->input('price.paid_price') < $list * $c['paid_min_ratio']) $v->errors()->add('price.paid_price', '실구매가가 차량가보다 너무 낮아요.');
                    $r = $this->input('price.receipt_upload_id');
                    if ($r) {
                        $u = Upload::find($r);
                        if (! $u || $u->user_id !== $this->user()->id || $u->purpose !== 'receipt') $v->errors()->add('price.receipt_upload_id', '올리지 않은 영수증이에요.');
                    }
                })(),
                default => null,
            };
            $op = $this->input('owner_price');
            if (is_array($op) && (float) $op['paid_price'] < (float) $op['list_price'] * config('community.publish.price.paid_min_ratio')) {
                $v->errors()->add('owner_price.paid_price', '실구매가가 차량가보다 너무 낮아요.');
            }
        }];
    }

    protected function prepareForValidation(): void
    {
        $t = fn ($k) => ($s = trim((string) $this->input($k))) === '' ? null : $s;
        $this->merge(['title' => $t('title'), 'body' => $t('body'), 'topic' => $t('topic'), 'circle' => $t('circle'), 'city' => $t('city')]);
    }
}
