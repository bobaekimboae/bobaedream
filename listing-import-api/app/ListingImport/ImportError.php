<?php

namespace App\ListingImport;

use RuntimeException;

class ImportError extends RuntimeException
{
    public function __construct(string $message, public string $codeName = 'error', public int $status = 400)
    {
        parent::__construct($message);
    }
}
