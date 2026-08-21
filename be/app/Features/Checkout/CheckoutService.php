<?php

namespace App\Features\Checkout;

use App\Features\Cart\CartService;
use App\Features\Catalog\Models\Product;
use App\Features\Checkout\Payment\PaymentGateway;
use App\Features\Orders\Models\Order;
use Illuminate\Support\Facades\DB;

class CheckoutService
{
    public function __construct(
        private readonly CartService $cart,
        private readonly PaymentGateway $gateway,
    ) {
    }

    /**
     * @param  array<string, string|null>  $address
     */
    public function checkout(string $userId, array $address): Order
    {
        $cart = $this->cart->forUser($userId)->load('items');

        if ($cart->items->isEmpty()) {
            throw new CheckoutException('Cart is empty');
        }

        return DB::transaction(function () use ($userId, $address, $cart): Order {
            $subtotal = 0;
            $lines = [];

            foreach ($cart->items as $item) {
                $product = Product::lockForUpdate()->findOrFail($item->product_id);

                if ($item->quantity > $product->stock) {
                    throw new CheckoutException('Not enough stock for '.$product->name);
                }

                $product->decrement('stock', $item->quantity);
                $subtotal += $item->quantity * $item->unit_price_cents;

                $lines[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $item->quantity,
                    'unit_price_cents' => $item->unit_price_cents,
                ];
            }

            $tax = (int) round($subtotal * (float) config('shop.tax_rate'));
            $total = $subtotal + $tax;

            $payment = $this->gateway->charge($total);
            if (! $payment->approved) {
                throw new CheckoutException('Payment declined');
            }

            $order = Order::create([
                'user_id' => $userId,
                'status' => 'paid',
                'subtotal_cents' => $subtotal,
                'tax_cents' => $tax,
                'total_cents' => $total,
                'payment_reference' => $payment->reference,
            ]);

            $order->items()->createMany($lines);
            $order->address()->create($address);
            $cart->items()->delete();

            return $order->load('items', 'address');
        });
    }
}
