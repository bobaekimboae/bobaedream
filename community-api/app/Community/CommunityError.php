<?php

namespace App\Community;

use RuntimeException;

/** 화면에 그대로 보여 줄 수 있는 한국어 오류. code 는 화면이 분기에 쓰는 영문 고정값. */
class CommunityError extends RuntimeException
{
    public function __construct(string $message, public string $codeName, public int $status = 422, public array $fields = [])
    {
        parent::__construct($message);
    }
}
