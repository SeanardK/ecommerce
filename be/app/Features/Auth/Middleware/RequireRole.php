<?php

namespace App\Features\Auth\Middleware;

use App\Features\Auth\AuthenticatedUser;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->attributes->get('authUser');

        if (! $user instanceof AuthenticatedUser || ! $user->hasRole($role)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
