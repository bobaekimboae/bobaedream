<?php

namespace App\Http\Resources;

use App\Community\Board;
use App\Models\VehicleModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * 화면 nuxt-review/app/lib/publish.ts 의 Post 모양(글쓰기 키트 6개 종류). PostView.vue 가 그대로 그린다.
 * 숫자 값(내 차 팔기 · 구매가)은 상세 표에 숫자로 두고, 화면에 보일 한 줄(sell · extra)은 여기서 만든다.
 */
class PublishResource extends JsonResource
{
    use PostCan;

    public function toArray(Request $request): array
    {
        $p = $this->resource;
        $b = $p->board;
        $vote = $p->relationLoaded('vote') ? $p->vote : null;
        $uid = $request->user()?->id;
        return [
            'id' => (string) $p->id,
            'kind' => $b->value,
            'createdAt' => $p->created_at->toIso8601String(),
            'title' => $p->title,
            'body' => $p->body,
            'media' => array_map(fn ($m) => array_filter(['kind' => $m['kind'], 'src' => $m['url'] ?? '', 'cover' => $m['cover_url'] ?? null, 'duration' => $m['duration'] ?? null], fn ($v) => $v !== null), $p->media ?? []),
            'car' => $p->vehicle ? self::car($p->vehicle) : null,
            'topic' => $p->topic, 'circle' => $p->circle, 'claim' => $p->claim, 'city' => $p->city,
            'vote' => $vote ? $this->vote($vote, $uid) : null,
            'ownerPrice' => $this->ownerPrice($p),
            'parts' => $p->attach['parts'] ?? [],
            'sell' => $b === Board::Sell && $p->sell ? [
                '등록 연월' => (int) substr($p->sell->reg_month, 0, 4) . '년 ' . (int) substr($p->sell->reg_month, 5, 2) . '월',
                '주행거리' => rtrim(rtrim(number_format($p->sell->odometer_km / 10000, 1, '.', ''), '0'), '.') . '만km',
                '차량 색상' => $p->sell->color,
                '소유자 변경' => $p->sell->owner_changes . '회',
                '희망 판매가' => number_format($p->sell->price_manwon) . '만원',
            ] : null,
            'extra' => $b === Board::Price && $p->price ? array_filter([
                '결제 방식' => ['full' => '일시불', 'loan' => '할부'][$p->price->pay] ?? '',
                '구매 대리점' => $p->price->dealer, '추가 혜택' => $p->price->gift,
                '영수증' => $p->price->receipt_upload_id ? '제출함(심사용, 공개 안 됨)' : '',
            ]) : null,
            'author' => $p->author->nickname,
            'avatar' => $p->author->avatar,
            'views' => $p->views, 'likes' => $p->likes, 'comments' => $p->comments,
            'commentList' => CommentResource::collection($p->relationLoaded('commentList') ? $p->commentList->take(3) : collect())->resolve($request),
            'mine' => $uid === $p->user_id,
            'can' => $this->can($request, $p),
        ];
    }

    public static function car(VehicleModel $v): array
    {
        return ['id' => $v->id, 'brand' => $v->brand, 'model' => $v->model, 'trim' => $v->trim, 'powertrain' => $v->powertrain, 'brandLogo' => $v->brand_logo, 'photo' => $v->photo];
    }

    private static function money(float $v): string
    {
        return rtrim(rtrim(number_format($v, 2, '.', ''), '0'), '.');
    }

    private function ownerPrice($p): ?array
    {
        if ($p->board === Board::Price && $p->price) {
            $d = $p->price;
            return ['car' => $p->vehicle ? self::car($p->vehicle) : null, 'month' => $d->purchase_month, 'nake' => self::money($d->list_price), 'total' => self::money($d->paid_price),
                'city' => $d->city, 'pay' => $d->pay, 'dealer' => $d->dealer ?? '', 'note' => $p->body];
        }
        $o = $p->attach['owner_price'] ?? null;
        if (! $o) return null;
        $v = VehicleModel::find($o['model_id']);
        return ['car' => $v ? self::car($v) : null, 'month' => $o['month'], 'nake' => self::money((float) $o['list_price']), 'total' => self::money((float) $o['paid_price']), 'city' => $o['city'] ?? ''];
    }

    private function vote($vote, ?int $uid): array
    {
        $counts = array_fill(0, count($vote->options), 0);
        $mine = [];
        foreach ($vote->ballots as $ballot) {
            foreach ($ballot->choices as $i) $counts[$i] = ($counts[$i] ?? 0) + 1;
            if ($ballot->user_id === $uid) $mine = $ballot->choices;
        }
        return [
            'title' => $vote->title, 'multi' => $vote->multi, 'options' => $vote->options,
            'until' => $vote->ends_at->timezone('Asia/Seoul')->format('n월 j일 G시') . ' 마감', 'endsAt' => $vote->ends_at->toIso8601String(),
            'closed' => $vote->ends_at->isPast(), 'counts' => $counts, 'voters' => $vote->ballots->count(), 'mine' => $mine,
        ];
    }
}
