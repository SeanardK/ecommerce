<?php

return [
    'base_url' => env('KEYCLOAK_BASE_URL', 'http://localhost:8080'),
    'realm' => env('KEYCLOAK_REALM', 'shop'),
    'client_id' => env('KEYCLOAK_CLIENT_ID', 'shop-api'),
    'issuer' => env(
        'KEYCLOAK_ISSUER',
        env('KEYCLOAK_BASE_URL', 'http://localhost:8080').'/realms/'.env('KEYCLOAK_REALM', 'shop'),
    ),
    'jwks_uri' => env(
        'KEYCLOAK_JWKS_URI',
        env('KEYCLOAK_ISSUER', env('KEYCLOAK_BASE_URL', 'http://localhost:8080').'/realms/'.env('KEYCLOAK_REALM', 'shop')).'/protocol/openid-connect/certs',
    ),
    'jwks_ttl' => (int) env('KEYCLOAK_JWKS_TTL', 300),
];
