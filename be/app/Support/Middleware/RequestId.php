<?php

namespace App\Support\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class RequestId
{
    public const HEADER = 'X-Request-Id';

    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->headers->get(self::HEADER) ?: (string) Str::uuid();
        $request->headers->set(self::HEADER, $requestId);
        $request->attributes->set('requestId', $requestId);

        Log::withContext(['request_id' => $requestId]);

        $startedAt = microtime(true);
        $response = $next($request);
        $response->headers->set(self::HEADER, $requestId);

        Log::info('http request', [
            'method' => $request->getMethod(),
            'path' => '/'.ltrim($request->path(), '/'),
            'status' => $response->getStatusCode(),
            'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
        ]);

        return $response;
    }
}
