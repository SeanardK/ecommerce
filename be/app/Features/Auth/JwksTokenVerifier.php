<?php

namespace App\Features\Auth;

use App\Features\Auth\Contracts\TokenVerifier;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Contracts\Cache\Repository as Cache;
use Illuminate\Http\Client\Factory as HttpClient;
use Throwable;

class JwksTokenVerifier implements TokenVerifier
{
    public function __construct(
        private readonly HttpClient $http,
        private readonly Cache $cache,
        private readonly string $issuer,
        private readonly string $jwksUri,
        private readonly int $jwksTtl,
    ) {
    }

    public function verify(string $token): AuthenticatedUser
    {
        $keys = JWK::parseKeySet($this->jwks());

        try {
            $decoded = (array) JWT::decode($token, $keys);
        } catch (Throwable $exception) {
            throw new InvalidTokenException('Token verification failed', 0, $exception);
        }

        if (($decoded['iss'] ?? null) !== $this->issuer) {
            throw new InvalidTokenException('Unexpected token issuer');
        }

        return self::mapClaims($decoded);
    }

    /**
     * @param  array<string, mixed>  $claims
     */
    public static function mapClaims(array $claims): AuthenticatedUser
    {
        $subject = $claims['sub'] ?? null;
        if (! is_string($subject) || $subject === '') {
            throw new InvalidTokenException('Token is missing a subject');
        }

        $email = $claims['email'] ?? $claims['preferred_username'] ?? '';
        $realmAccess = (array) ($claims['realm_access'] ?? []);
        $roles = array_values(array_filter(
            (array) ($realmAccess['roles'] ?? []),
            'is_string',
        ));

        return new AuthenticatedUser($subject, (string) $email, $roles);
    }

    /**
     * @return array<string, mixed>
     */
    private function jwks(): array
    {
        return $this->cache->remember('keycloak.jwks', $this->jwksTtl, function (): array {
            return $this->http
                ->get($this->jwksUri)
                ->throw()
                ->json();
        });
    }
}
