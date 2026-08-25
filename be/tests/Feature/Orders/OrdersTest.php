<?php

namespace Tests\Feature\Orders;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use App\Features\Orders\Models\Order;
use App\Features\Orders\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeTokenVerifier;
use Tests\TestCase;

class OrdersTest extends TestCase
{
    use RefreshDatabase;

    private function actAs(string $userId, array $roles = ['customer']): array
    {
        $this->app->instance(
            TokenVerifier::class,
            (new FakeTokenVerifier())->withUser(
                'token',
                new AuthenticatedUser($userId, "{$userId}@test.com", $roles),
            ),
        );

        return ['Authorization' => 'Bearer token'];
    }

    private function orderFor(string $userId, string $status = 'paid'): Order
    {
        $category = Category::firstOrCreate(['slug' => 'audio'], ['name' => 'Audio']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Headphones',
            'slug' => 'headphones-'.uniqid(),
            'description' => 'desc',
            'price_cents' => 1000,
            'stock' => 5,
            'active' => true,
        ]);

        $order = Order::create([
            'user_id' => $userId,
            'status' => $status,
            'subtotal_cents' => 1000,
            'tax_cents' => 100,
            'total_cents' => 1100,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => 1,
            'unit_price_cents' => 1000,
        ]);

        return $order;
    }

    public function test_orders_require_authentication(): void
    {
        $this->getJson('/api/orders')->assertUnauthorized();
    }

    public function test_it_lists_only_the_authenticated_users_orders(): void
    {
        $this->orderFor('other-user');
        $order = $this->orderFor('customer-1');

        $this->getJson('/api/orders', $this->actAs('customer-1'))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['id' => $order->id]);
    }

    public function test_it_shows_a_single_order_with_items(): void
    {
        $order = $this->orderFor('customer-1');

        $this->getJson("/api/orders/{$order->id}", $this->actAs('customer-1'))
            ->assertOk()
            ->assertJsonFragment(['id' => $order->id])
            ->assertJsonPath('items.0.quantity', 1);
    }

    public function test_it_returns_404_for_another_users_order(): void
    {
        $order = $this->orderFor('other-user');

        $this->getJson("/api/orders/{$order->id}", $this->actAs('customer-1'))
            ->assertNotFound();
    }

    public function test_admin_lists_all_orders_across_users(): void
    {
        $this->orderFor('customer-1');
        $this->orderFor('customer-2');

        $this->getJson('/api/admin/orders', $this->actAs('admin-1', ['admin']))
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_non_admin_cannot_list_all_orders(): void
    {
        $this->orderFor('customer-1');

        $this->getJson('/api/admin/orders', $this->actAs('customer-1'))
            ->assertForbidden();
    }

    public function test_orders_are_paginated_and_per_page_is_capped(): void
    {
        for ($i = 0; $i < 3; $i++) {
            $this->orderFor('customer-1');
        }

        $this->getJson('/api/orders?per_page=2', $this->actAs('customer-1'))
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('total', 3)
            ->assertJsonPath('last_page', 2);

        $this->getJson('/api/orders?per_page=999', $this->actAs('customer-1'))
            ->assertOk()
            ->assertJsonPath('per_page', 50);
    }
}
