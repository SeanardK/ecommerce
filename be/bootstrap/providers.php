<?php

use App\Features\Auth\AuthServiceProvider;
use App\Features\Checkout\CheckoutServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    AuthServiceProvider::class,
    CheckoutServiceProvider::class,
];
