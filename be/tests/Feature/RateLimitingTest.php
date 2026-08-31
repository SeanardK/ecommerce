<?php

namespace Tests\Feature;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeTokenVerifier;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    private array $address = [
        'line1' => '1 Test Street',
        'city' => 'Testville',
        'region' => 'TS',
        'postal_code' => '12345',
        'country' => 'Testland',
    ];

    private function actAsCustomer(): array
    {
        $this->app->instance(
            TokenVerifier::class,
            (new FakeTokenVerifier())->withUser(
                'token',
                new AuthenticatedUser('customer-1', 'buyer@test.com', ['customer']),
            ),
        );

        return ['Authorization' => 'Bearer token'];
    }

    public function test_general_api_routes_are_throttled(): void
    {
        for ($i = 0; $i < 60; $i++) {
            $this->getJson('/api/categories')->assertOk();
        }

        $this->getJson('/api/categories')->assertStatus(429);
    }

    public function test_checkout_is_throttled_more_tightly_than_general_api(): void
    {
        $headers = $this->actAsCustomer();
        $category = Category::create(['name' => 'Audio', 'slug' => 'audio']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Headphones',
            'slug' => 'headphones',
            'description' => 'desc',
            'price_cents' => 1000,
            'stock' => 100,
            'active' => true,
        ]);

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1], $headers);
            $this->postJson('/api/checkout', $this->address, $headers)->assertCreated();
        }

        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1], $headers);
        $this->postJson('/api/checkout', $this->address, $headers)->assertStatus(429);
    }
}
