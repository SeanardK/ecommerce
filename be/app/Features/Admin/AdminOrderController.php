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

    public function index()
    {
        return $this->orders->all();
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
