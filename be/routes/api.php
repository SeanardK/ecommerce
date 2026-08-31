<?php

use App\Features\Admin\AdminCategoryController;
use App\Features\Admin\AdminImageController;
use App\Features\Admin\AdminOrderController;
use App\Features\Admin\AdminProductController;
use App\Features\Auth\AuthenticatedUser;
use App\Features\Cart\CartController;
use App\Features\Catalog\CatalogController;
use App\Features\Checkout\CheckoutController;
use App\Features\Checkout\PaymentWebhookController;
use App\Features\Orders\OrdersController;
use App\Support\HealthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);

Route::post('/webhooks/payment', [PaymentWebhookController::class, 'handle'])
    ->middleware('throttle:30,1');

Route::middleware('throttle:api')->group(function () {
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/{slug}', [CatalogController::class, 'show']);

    Route::middleware('keycloak')->group(function () {
        Route::get('/cart', [CartController::class, 'show']);
        Route::post('/cart/items', [CartController::class, 'add']);
        Route::put('/cart/items/{productId}', [CartController::class, 'update']);
        Route::delete('/cart/items/{productId}', [CartController::class, 'remove']);

        Route::post('/checkout', [CheckoutController::class, 'store'])->middleware('throttle:checkout');
        Route::get('/orders', [OrdersController::class, 'index']);
        Route::get('/orders/{order}', [OrdersController::class, 'show']);
        Route::post('/orders/{order}/cancel', [OrdersController::class, 'cancel']);
    });

    Route::middleware(['keycloak', 'role:admin'])->prefix('admin')->group(function () {
        Route::get('/products', [AdminProductController::class, 'index']);
        Route::post('/products', [AdminProductController::class, 'store']);
        Route::post('/products/images', [AdminImageController::class, 'store']);
        Route::put('/products/{product}', [AdminProductController::class, 'update']);
        Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);

        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);

        Route::get('/orders', [AdminOrderController::class, 'index']);
        Route::patch('/orders/{order}/status', [AdminOrderController::class, 'updateStatus']);
    });

    Route::middleware('keycloak')->get('/me', function (Request $request) {
        /** @var AuthenticatedUser $user */
        $user = $request->attributes->get('authUser');

        return [
            'id' => $user->id,
            'email' => $user->email,
            'roles' => $user->roles,
        ];
    });
});
