<?php

namespace App\Features\Checkout;

use App\Features\Checkout\Payment\MockGateway;
use App\Features\Checkout\Payment\PaymentGateway;
use Illuminate\Support\ServiceProvider;

class CheckoutServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, MockGateway::class);
    }
}
