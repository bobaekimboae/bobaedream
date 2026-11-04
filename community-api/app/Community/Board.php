<?php

namespace App\Community;

/**
 * 게시판(글 종류). 주소 {board} 에 그대로 쓰인다.
 * review · fuel = 차량 리뷰 · 연비 게시판(2026-11-01), 나머지 6개 = 동처띠 글쓰기 키트(发布 탭 8개 중 리뷰 · 연비 외, 2026-11-04).
 */
enum Board: string
{
    case Review = 'review';
    case Fuel = 'fuel';
    case Dynamic = 'dynamic'; // 일상(动态)
    case Ask = 'ask';         // 질문(提问)
    case Video = 'video';     // 영상(视频)
    case Long = 'long';       // 긴 글(长帖)
    case Sell = 'sell';       // 내 차 팔기(卖车帖)
    case Price = 'price';     // 구매가(车主价)

    /** 리뷰 · 연비가 아닌 글쓰기 키트 글 */
    public function isPublisher(): bool
    {
        return ! in_array($this, [self::Review, self::Fuel], true);
    }

    /** 차종이 꼭 있어야 하는 글 */
    public function needsVehicle(): bool
    {
        return in_array($this, [self::Review, self::Fuel, self::Sell, self::Price], true);
    }
}
