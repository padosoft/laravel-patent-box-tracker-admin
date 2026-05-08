<?php

declare(strict_types=1);

namespace Padosoft\PatentBoxTrackerAdmin;

use Illuminate\Support\ServiceProvider;

final class PatentBoxTrackerAdminServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->publishes([
            __DIR__ . '/../project' => public_path('vendor/patent-box-admin'),
        ], 'patent-box-admin-assets');
    }
}

