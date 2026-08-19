<?php

use App\Features\Auth\AuthenticatedUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => ['status' => 'ok']);

Route::middleware('keycloak')->get('/me', function (Request $request) {
    /** @var AuthenticatedUser $user */
    $user = $request->attributes->get('authUser');

    return [
        'id' => $user->id,
        'email' => $user->email,
        'roles' => $user->roles,
    ];
});
