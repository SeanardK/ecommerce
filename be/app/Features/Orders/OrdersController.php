<?php

namespace App\Features\Orders;

use App\Features\Auth\AuthenticatedUser;
use Illuminate\Http\Request;

class OrdersController
{
    public function __construct(private readonly OrdersService $orders)
    {
    }

    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 10), 50);

        return $this->orders->listForUser($this->userId($request), $perPage);
    }

    public function show(Request $request, int $order)
    {
        return $this->orders->findForUser($this->userId($request), $order);
    }

    private function userId(Request $request): string
    {
        /** @var AuthenticatedUser $user */
        $user = $request->attributes->get('authUser');

        return $user->id;
    }
}
