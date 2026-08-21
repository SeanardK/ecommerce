<?php

namespace App\Features\Checkout\Payment;

class PaymentResult
{
    public function __construct(
        public readonly bool $approved,
        public readonly string $reference,
    ) {
    }
}
