<?php

namespace App\Shoot;

use RuntimeException;

/** 화면에 그대로 보여 줄 수 있는 오류(쉬운 한국어) */
class ShootError extends RuntimeException
{
    public function __construct(string $message, public int $status = 422, public string $codeName = 'invalid')
    {
        parent::__construct($message);
    }
}
