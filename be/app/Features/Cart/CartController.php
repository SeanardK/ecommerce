<?php

namespace App\Features\Cart;

use App\Features\Auth\AuthenticatedUser;
use Illuminate\Http\Request;

class CartController
{
    public function __construct(private readonly CartService $cart)
    {
    }

    public function show(Request $request)
    {
        return $this->cart->summary($this->userId($request));
    }

    public function add(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $this->cart->addItem($this->userId($request), $data['product_id'], $data['quantity']);

        return $this->cart->summary($this->userId($request));
    }

    public function update(Request $request, int $productId)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:0'],
        ]);

        $this->cart->updateQuantity($this->userId($request), $productId, $data['quantity']);

        return $this->cart->summary($this->userId($request));
    }

    public function remove(Request $request, int $productId)
    {
        $this->cart->removeItem($this->userId($request), $productId);

        return $this->cart->summary($this->userId($request));
    }

    private function userId(Request $request): string
    {
        /** @var AuthenticatedUser $user */
        $user = $request->attributes->get('authUser');

        return $user->id;
    }
}
