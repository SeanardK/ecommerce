<?php

namespace App\Features\Auth;

use App\Features\Auth\Contracts\TokenVerifier;
use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Http\Client\Factory as HttpClient;
use Illuminate\Support\ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(TokenVerifier::class, function ($app): TokenVerifier {
            return new JwksTokenVerifier(
                $app->make(HttpClient::class),
                $app->make(Cache::class),
                (string) config('keycloak.issuer'),
                (int) config('keycloak.jwks_ttl'),
            );
        });
    }
}
