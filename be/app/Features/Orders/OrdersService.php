<?php

namespace App\Features\Orders;

use App\Features\Orders\Models\Order;
use Illuminate\Database\Eloquent\Collection;

class OrdersService
{
    private const TRANSITIONS = [
        'pending' => ['paid', 'cancelled'],
        'paid' => ['fulfilled', 'cancelled'],
        'fulfilled' => ['completed'],
        'completed' => [],
        'cancelled' => [],
    ];

    public function listForUser(string $userId): Collection
    {
        return Order::with('items')
            ->where('user_id', $userId)
            ->latest()
            ->get();
    }

    public function findForUser(string $userId, int $orderId): Order
    {
        return Order::with('items', 'address')
            ->where('user_id', $userId)
            ->findOrFail($orderId);
    }

    public function all(): Collection
    {
        return Order::with('items')->latest()->get();
    }

    public function transition(Order $order, string $status): Order
    {
        $allowed = self::TRANSITIONS[$order->status] ?? [];

        if (! in_array($status, $allowed, true)) {
            throw new OrdersException("Cannot move order from {$order->status} to {$status}");
        }

        $order->update(['status' => $status]);

        return $order;
    }
}
