<?php

namespace App\Features\Admin;

use App\Features\Orders\Models\Order;
use App\Features\Orders\OrdersService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminOrderController
{
    public function __construct(private readonly OrdersService $orders)
    {
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 20), 100);

        return $this->orders->all($perPage);
    }

    public function updateStatus(Request $request, int $order)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(Order::STATUSES)],
        ]);

        $model = Order::findOrFail($order);

        return $this->orders->transition($model, $data['status']);
    }
}
