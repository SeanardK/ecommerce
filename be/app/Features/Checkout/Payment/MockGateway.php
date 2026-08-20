<?php

namespace App\Features\Checkout\Payment;

use Illuminate\Support\Str;

class MockGateway implements PaymentGateway
{
    public function charge(int $amountCents): PaymentResult
    {
        return new PaymentResult(true, 'mock_'.Str::uuid()->toString());
    }
}
