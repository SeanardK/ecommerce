<?php

namespace Tests\Feature\Admin;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use App\Features\Catalog\Models\Category;
use App\Features\Orders\Models\Order;
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
}
