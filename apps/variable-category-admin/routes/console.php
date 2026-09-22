<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('category-admin:doctor', function (): void {
    $this->info('Application booted. Run migrations, queue and resolver checks before deployment.');
})->purpose('Verify the category admin runtime can boot.');
