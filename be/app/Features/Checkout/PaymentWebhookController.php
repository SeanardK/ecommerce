<?php

namespace App\Features\Checkout;

use App\Features\Orders\Models\Order;
use App\Features\Orders\OrdersException;
use App\Features\Orders\OrdersService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentWebhookController
{
    public function __construct(private readonly OrdersService $orders)
    {
    }

    public function handle(Request $request)
    {
        if (! $this->hasValidSignature($request)) {
            return response()->json(['message' => 'Invalid webhook signature'], 401);
        }

        $data = $request->validate([
            'reference' => ['required', 'string'],
            'event' => ['required', 'string', 'in:payment.succeeded,payment.failed'],
        ]);

        $order = Order::where('payment_reference', $data['reference'])->first();

        if (! $order) {
            return response()->json(['status' => 'ignored'], 200);
        }

        if ($order->status !== 'pending') {
            return response()->json(['status' => 'already_processed'], 200);
        }

        $target = $data['event'] === 'payment.succeeded' ? 'paid' : 'cancelled';

        try {
            $this->orders->transition($order, $target);
        } catch (OrdersException $e) {
            Log::warning('payment webhook could not transition order', [
                'order_id' => $order->id,
                'target' => $target,
                'message' => $e->getMessage(),
            ]);
        }

        return response()->json(['status' => 'ok'], 200);
    }

    private function hasValidSignature(Request $request): bool
    {
        $secret = (string) config('shop.payment_webhook_secret');
        $signature = (string) $request->header('X-Signature');

        if ($secret === '' || $signature === '') {
            return false;
        }

        $expected = hash_hmac('sha256', $request->getContent(), $secret);

        return hash_equals($expected, $signature);
    }
}
