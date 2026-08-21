<?php

namespace Tests\Feature\Cart;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeTokenVerifier;
use Tests\TestCase;

class CartTest extends TestCase
{
    use RefreshDatabase;

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

    private function product(int $stock = 10, int $price = 1000): Product
    {
        $category = Category::create(['name' => 'Audio', 'slug' => 'audio']);

        return Product::create([
            'category_id' => $category->id,
            'name' => 'Headphones',
            'slug' => 'headphones',
            'description' => 'desc',
            'price_cents' => $price,
            'stock' => $stock,
            'active' => true,
        ]);
    }

    public function test_it_adds_an_item_and_computes_subtotal(): void
    {
        $headers = $this->actAsCustomer();
        $product = $this->product(price: 1500);

        $this->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ], $headers)
            ->assertOk()
            ->assertJson(['subtotal_cents' => 3000]);
    }

    public function test_it_rejects_quantity_above_stock(): void
    {
        $headers = $this->actAsCustomer();
        $product = $this->product(stock: 1);

        $this->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 5,
        ], $headers)->assertStatus(422);
    }

    public function test_it_updates_and_removes_items(): void
    {
        $headers = $this->actAsCustomer();
        $product = $this->product();

        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2], $headers);

        $this->putJson("/api/cart/items/{$product->id}", ['quantity' => 4], $headers)
            ->assertOk()
            ->assertJson(['subtotal_cents' => 4000]);

        $this->deleteJson("/api/cart/items/{$product->id}", [], $headers)
            ->assertOk()
            ->assertJson(['subtotal_cents' => 0]);
    }

    public function test_cart_requires_authentication(): void
    {
        $this->getJson('/api/cart')->assertUnauthorized();
    }
}
