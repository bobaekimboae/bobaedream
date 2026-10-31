<?php

namespace App\Shoot;

use Illuminate\Support\ServiceProvider;

class ShootServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(base_path('config/shoot.php'), 'shoot');
        $this->app->singleton(BlobClient::class, fn () => new BlobClient(config('shoot.blob')));
        $this->app->singleton(ShootStore::class, fn () => config('shoot.store') === 'db'
            ? new DbShootStore()
            : new BlobShootStore($this->app->make(BlobClient::class)));
    }
}
