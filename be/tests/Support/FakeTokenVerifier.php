<?php

namespace Tests\Support;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use App\Features\Auth\InvalidTokenException;

class FakeTokenVerifier implements TokenVerifier
{
    /**
     * @param  array<string, AuthenticatedUser>  $users
     */
    public function __construct(private array $users = [])
    {
    }

    public function withUser(string $token, AuthenticatedUser $user): self
    {
        $this->users[$token] = $user;

        return $this;
    }

    public function verify(string $token): AuthenticatedUser
    {
        if (! isset($this->users[$token])) {
            throw new InvalidTokenException('Unknown token');
        }

        return $this->users[$token];
    }
}
