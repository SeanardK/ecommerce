<?php

namespace App\Features\Auth\Middleware;

use App\Features\Auth\Contracts\TokenVerifier;
use App\Features\Auth\InvalidTokenException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class KeycloakAuth
{
    public function __construct(private readonly TokenVerifier $verifier)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization', '');
        if (! str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Missing bearer token'], 401);
        }

        try {
            $user = $this->verifier->verify(substr($header, 7));
        } catch (InvalidTokenException) {
            return response()->json(['message' => 'Invalid token'], 401);
        }

        $request->attributes->set('authUser', $user);

        return $next($request);
    }
}
