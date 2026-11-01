<?php

namespace App\Community;

/** 게시판 두 개: review(차량 리뷰 · 懂车分) · fuel(연비 · 전비 · 车主续航). 주소 {board} 에 그대로 쓰인다. */
enum Board: string
{
    case Review = 'review';
    case Fuel = 'fuel';
}
