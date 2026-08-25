<?php

namespace Tests\Feature\Admin;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use App\Features\Orders\Models\Order;
use App\Features\Orders\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeTokenVerifier;
use Tests\TestCase;

class AdminTest extends TestCase
{
    use RefreshDatabase;

    private function actAs(array $roles): array
    {
        $this->app->instance(
            TokenVerifier::class,
            (new FakeTokenVerifier())->withUser(
                'token',
                new AuthenticatedUser('user-1', 'user@test.com', $roles),
            ),
        );

        return ['Authorization' => 'Bearer token'];
    }

    public function test_non_admin_cannot_create_products(): void
    {
        $headers = $this->actAs(['customer']);
        $category = Category::create(['name' => 'Audio', 'slug' => 'audio']);

        $this->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'New',
            'description' => 'desc',
            'price_cents' => 1000,
            'stock' => 5,
            'active' => true,
        ], $headers)->assertForbidden();
    }

    public function test_admin_creates_a_product(): void
    {
        $headers = $this->actAs(['admin']);
        $category = Category::create(['name' => 'Audio', 'slug' => 'audio']);

        $this->postJson('/api/admin/products', [
            'category_id' => $category->id,
            'name' => 'New Speaker',
            'description' => 'desc',
            'price_cents' => 1000,
            'stock' => 5,
            'active' => true,
        ], $headers)
            ->assertCreated()
            ->assertJson(['name' => 'New Speaker', 'slug' => 'new-speaker']);
    }

    public function test_admin_advances_order_status(): void
    {
        $headers = $this->actAs(['admin']);
        $order = Order::create([
            'user_id' => 'customer-1',
            'status' => 'paid',
            'subtotal_cents' => 1000,
            'tax_cents' => 100,
            'total_cents' => 1100,
        ]);

        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'fulfilled'], $headers)
            ->assertOk()
            ->assertJson(['status' => 'fulfilled']);
    }

    public function test_admin_cannot_make_an_invalid_status_transition(): void
    {
        $headers = $this->actAs(['admin']);
        $order = Order::create([
            'user_id' => 'customer-1',
            'status' => 'pending',
            'subtotal_cents' => 1000,
            'tax_cents' => 100,
            'total_cents' => 1100,
        ]);

        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'completed'], $headers)
            ->assertStatus(422);
    }

    public function test_admin_creates_a_category(): void
    {
        $headers = $this->actAs(['admin']);

        $this->postJson('/api/admin/categories', ['name' => 'Gaming'], $headers)
            ->assertCreated()
            ->assertJson(['name' => 'Gaming', 'slug' => 'gaming']);
    }

    public function test_cancelling_an_order_restocks_products(): void
    {
        $headers = $this->actAs(['admin']);
        $category = Category::create(['name' => 'Audio', 'slug' => 'audio']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Headphones',
            'slug' => 'headphones',
            'description' => 'desc',
            'price_cents' => 1000,
            'stock' => 3,
            'active' => true,
        ]);
        $order = Order::create([
            'user_id' => 'customer-1',
            'status' => 'paid',
            'subtotal_cents' => 2000,
            'tax_cents' => 200,
            'total_cents' => 2200,
        ]);
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => 'Headphones',
            'quantity' => 2,
            'unit_price_cents' => 1000,
        ]);

        $this->patchJson("/api/admin/orders/{$order->id}/status", ['status' => 'cancelled'], $headers)
            ->assertOk()
            ->assertJson(['status' => 'cancelled']);

        $this->assertSame(5, $product->fresh()->stock);
    }
}
