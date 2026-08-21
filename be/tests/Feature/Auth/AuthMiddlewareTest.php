<?php

namespace Tests\Feature\Auth;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use Tests\Support\FakeTokenVerifier;
use Tests\TestCase;

class AuthMiddlewareTest extends TestCase
{
    public function test_health_route_is_public(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJson(['status' => 'ok']);
    }

    public function test_me_requires_a_bearer_token(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_me_returns_the_authenticated_user(): void
    {
        $this->app->instance(
            TokenVerifier::class,
            (new FakeTokenVerifier())->withUser(
                'valid',
                new AuthenticatedUser('user-1', 'buyer@test.com', ['customer']),
            ),
        );

        $this->getJson('/api/me', ['Authorization' => 'Bearer valid'])
            ->assertOk()
            ->assertJson([
                'id' => 'user-1',
                'email' => 'buyer@test.com',
                'roles' => ['customer'],
            ]);
    }

    public function test_invalid_token_is_rejected(): void
    {
        $this->app->instance(TokenVerifier::class, new FakeTokenVerifier());

        $this->getJson('/api/me', ['Authorization' => 'Bearer nope'])
            ->assertUnauthorized();
    }
}
