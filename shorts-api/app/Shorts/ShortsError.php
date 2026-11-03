<?php

namespace App\Shorts;

use RuntimeException;

class ShortsError extends RuntimeException
{
    public function __construct(string $message, public readonly int $status = 400, public readonly string $codeName = 'bad_request')
    {
        parent::__construct($message);
    }
}
