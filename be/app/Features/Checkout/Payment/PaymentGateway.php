<?php

namespace App\Features\Checkout\Payment;

interface PaymentGateway
{
    public function charge(int $amountCents): PaymentResult;
}
