<?php

namespace App\Features\Checkout;

use App\Features\Auth\AuthenticatedUser;
use Illuminate\Http\Request;

class CheckoutController
{
    public function __construct(private readonly CheckoutService $checkout)
    {
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'line1' => ['required', 'string'],
            'line2' => ['nullable', 'string'],
            'city' => ['required', 'string'],
            'region' => ['required', 'string'],
            'postal_code' => ['required', 'string'],
            'country' => ['required', 'string'],
        ]);

        /** @var AuthenticatedUser $user */
        $user = $request->attributes->get('authUser');

        $order = $this->checkout->checkout($user->id, $data);

        return response()->json($order, 201);
    }
}
