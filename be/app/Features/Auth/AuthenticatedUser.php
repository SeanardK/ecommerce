<?php

namespace App\Features\Auth;

class AuthenticatedUser
{
    /**
     * @param  array<int, string>  $roles
     */
    public function __construct(
        public readonly string $id,
        public readonly string $email,
        public readonly array $roles,
    ) {
    }

    public function hasRole(string $role): bool
    {
        return in_array($role, $this->roles, true);
    }
}
