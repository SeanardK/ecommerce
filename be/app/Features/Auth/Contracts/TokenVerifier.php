<?php

namespace App\Features\Auth\Contracts;

use App\Features\Auth\AuthenticatedUser;

interface TokenVerifier
{
    public function verify(string $token): AuthenticatedUser;
}
