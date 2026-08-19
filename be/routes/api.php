<?php

use App\Features\Auth\AuthenticatedUser;
use App\Features\Cart\CartController;
use App\Features\Catalog\CatalogController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);

Route::get('/categories', [CatalogController::class, 'categories']);
Route::get('/products', [CatalogController::class, 'products']);
Route::get('/products/{slug}', [CatalogController::class, 'show']);

Route::middleware('keycloak')->group(function () {
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'add']);
    Route::put('/cart/items/{productId}', [CartController::class, 'update']);
    Route::delete('/cart/items/{productId}', [CartController::class, 'remove']);
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
