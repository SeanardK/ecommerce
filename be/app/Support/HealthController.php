<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

class HealthController
{
    public function __invoke()
    {
        $database = 'up';

        try {
            DB::select('select 1');
        } catch (Throwable $exception) {
            $database = 'down';
            Log::error('health check failed', [
                'check' => 'database',
                'error' => $exception->getMessage(),
            ]);
        }

        $healthy = $database === 'up';

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => ['database' => $database],
        ], $healthy ? 200 : 503);
    }
}
