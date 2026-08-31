<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($this->throttleKey($request));
        });

        RateLimiter::for('checkout', function (Request $request) {
            return Limit::perMinute(6)->by($this->throttleKey($request));
        });
    }

    private function throttleKey(Request $request): string
    {
        $user = $request->attributes->get('authUser');

        return $user?->id ?? $request->ip();
    }
}
