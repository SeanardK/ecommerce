<?php

namespace Tests\Unit\Auth;

use App\Features\Auth\InvalidTokenException;
use App\Features\Auth\JwksTokenVerifier;
use PHPUnit\Framework\TestCase;

class MapClaimsTest extends TestCase
{
    public function test_it_maps_subject_email_and_roles(): void
    {
        $user = JwksTokenVerifier::mapClaims([
            'sub' => 'user-1',
            'email' => 'buyer@test.com',
            'realm_access' => ['roles' => ['customer', 'offline_access']],
        ]);

        $this->assertSame('user-1', $user->id);
        $this->assertSame('buyer@test.com', $user->email);
        $this->assertTrue($user->hasRole('customer'));
        $this->assertFalse($user->hasRole('admin'));
    }

    public function test_it_falls_back_to_preferred_username(): void
    {
        $user = JwksTokenVerifier::mapClaims([
            'sub' => 'user-2',
            'preferred_username' => 'ann',
        ]);

        $this->assertSame('ann', $user->email);
        $this->assertSame([], $user->roles);
    }

    public function test_it_rejects_claims_without_subject(): void
    {
        $this->expectException(InvalidTokenException::class);

        JwksTokenVerifier::mapClaims(['email' => 'x@test.com']);
    }
}
