<?php

return [
    'tax_rate' => (float) env('SHOP_TAX_RATE', 0.1),
    'payment_webhook_secret' => env('PAYMENT_WEBHOOK_SECRET'),
];
