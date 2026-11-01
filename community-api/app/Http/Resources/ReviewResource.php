<?php

namespace App\Http\Resources;

use App\Community\RatingRules;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** 화면 lib/data.ts 의 Review 모양 */
class ReviewResource extends JsonResource
{
    use PostCan;

    public function toArray(Request $request): array
    {
        $d = $this->review;
        $v = $this->vehicle;
        preg_match('/^(\d{4})/', $v->trim, $y);
        return $this->common($request, $this->resource) + [
            'year' => (int) ($y[1] ?? $this->created_at->year),
            'powertrain' => $v->powertrain,
            'rating' => $d->rating,
            'ratings' => collect($d->ratings)->map(fn ($score, $k) => ['label' => RatingRules::LABELS[$k] ?? $k, 'score' => (float) $score])->values()->all(),
            'owner' => $d->owner,
            'ownership' => $d->owner ? $this->ownership($d->purchase_month) : '시승 리뷰',
            'location' => $d->purchase_city ?? '',
            'benchmark' => $v->segment ? sprintf('%s 평균 %.2f', $v->segment, $v->segment_score) : '',
            'purchase' => $d->owner ? [
                'month' => $d->purchase_month,
                'price' => $d->purchase_price,
                'city' => $d->purchase_city,
                'metric' => rtrim(rtrim(number_format($d->purchase_metric, 1, '.', ''), '0'), '.') . RatingRules::metricUnit($v->powertrain),
            ] : null,
        ];
    }

    /** 「보유 3개월」 · 「보유 2년」 · 1개월이 안 되면 「보유 1개월 미만」 */
    private function ownership(?string $month): string
    {
        if (! $month) return '오너';
        [$yy, $mm] = array_map('intval', explode('.', $month));
        $n = (now()->year - $yy) * 12 + now()->month - $mm;
        return $n < 1 ? '보유 1개월 미만' : ($n < 12 ? "보유 {$n}개월" : '보유 ' . intdiv($n, 12) . '년');
    }
}
