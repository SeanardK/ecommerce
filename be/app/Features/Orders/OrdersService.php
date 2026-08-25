<?php

namespace App\Features\Orders;

use App\Features\Catalog\Models\Product;
use App\Features\Orders\Models\Order;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class OrdersService
{
    private const TRANSITIONS = [
        'pending' => ['paid', 'cancelled'],
        'paid' => ['fulfilled', 'cancelled'],
        'fulfilled' => ['completed'],
        'completed' => [],
        'cancelled' => [],
    ];

    public function listForUser(string $userId, int $perPage = 10): LengthAwarePaginator
    {
        return Order::with('items')
            ->where('user_id', $userId)
            ->latest()
            ->paginate($perPage);
    }

    public function findForUser(string $userId, int $orderId): Order
    {
        return Order::with('items', 'address')
            ->where('user_id', $userId)
            ->findOrFail($orderId);
    }

    public function all(int $perPage = 20): LengthAwarePaginator
    {
        return Order::with('items')->latest()->paginate($perPage);
    }

    public function cancelForUser(string $userId, int $orderId): Order
    {
        $order = Order::where('user_id', $userId)->findOrFail($orderId);

        return $this->transition($order, 'cancelled');
    }

    public function transition(Order $order, string $status): Order
    {
        $allowed = self::TRANSITIONS[$order->status] ?? [];

        if (! in_array($status, $allowed, true)) {
            throw new OrdersException("Cannot move order from {$order->status} to {$status}");
        }

        return DB::transaction(function () use ($order, $status): Order {
            if ($status === 'cancelled') {
                foreach ($order->items as $item) {
                    Product::whereKey($item->product_id)->increment('stock', $item->quantity);
                }
            }

            $order->update(['status' => $status]);

            return $order;
        });
    }
}
