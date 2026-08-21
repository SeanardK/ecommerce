<?php

namespace App\Features\Cart;

use App\Features\Cart\Models\Cart;
use App\Features\Cart\Models\CartItem;
use App\Features\Catalog\Models\Product;


class CartService
{
    public function forUser(string $userId): Cart
    {
        return Cart::firstOrCreate(['user_id' => $userId]);
    }

    public function addItem(string $userId, int $productId, int $quantity): Cart
    {
        if ($quantity < 1) {
            throw new CartException('Quantity must be at least one');
        }

        $product = Product::where('active', true)->findOrFail($productId);
        $cart = $this->forUser($userId);

        $item = $cart->items()->firstOrNew(['product_id' => $productId]);
        $desired = ($item->quantity ?? 0) + $quantity;

        if ($desired > $product->stock) {
            throw new CartException('Not enough stock');
        }

        $item->quantity = $desired;
        $item->unit_price_cents = $product->price_cents;
        $item->save();

        return $cart->fresh('items');
    }

    public function updateQuantity(string $userId, int $productId, int $quantity): Cart
    {
        $cart = $this->forUser($userId);
        $item = $cart->items()->where('product_id', $productId)->first();

        if (! $item) {
            throw new CartException('Item not in cart');
        }

        if ($quantity <= 0) {
            $item->delete();

            return $cart->fresh('items');
        }

        $product = Product::findOrFail($productId);
        if ($quantity > $product->stock) {
            throw new CartException('Not enough stock');
        }

        $item->quantity = $quantity;
        $item->save();

        return $cart->fresh('items');
    }

    public function removeItem(string $userId, int $productId): Cart
    {
        $cart = $this->forUser($userId);
        $cart->items()->where('product_id', $productId)->delete();

        return $cart->fresh('items');
    }

    /**
     * @return array{items: array<int, array<string, mixed>>, subtotal_cents: int}
     */
    public function summary(string $userId): array
    {
        $cart = $this->forUser($userId)->load('items.product:id,name,slug');

        $items = $cart->items->map(fn (CartItem $item) => [
            'product_id' => $item->product_id,
            'name' => $item->product?->name,
            'quantity' => $item->quantity,
            'unit_price_cents' => $item->unit_price_cents,
            'line_total_cents' => $item->lineTotalCents(),
        ])->all();

        $subtotal = array_sum(array_column($items, 'line_total_cents'));

        return ['items' => $items, 'subtotal_cents' => $subtotal];
    }
}
