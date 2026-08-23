<?php

namespace Tests\Feature\Checkout;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeTokenVerifier;
use Tests\TestCase;

class CheckoutTest extends TestCase
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

    public function test_it_checks_out_a_cart_into_a_paid_order(): void
    {
        $headers = $this->actAsCustomer();
        $product = $this->product(stock: 5, price: 2000);

        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 2], $headers)
            ->assertOk();

        $response = $this->postJson('/api/checkout', $this->address, $headers)
            ->assertCreated()
            ->assertJson([
                'status' => 'paid',
                'subtotal_cents' => 4000,
                'tax_cents' => 400,
                'total_cents' => 4400,
            ]);

        $this->assertNotNull($response->json('payment_reference'));
        $this->assertSame(3, $product->fresh()->stock);
        $this->getJson('/api/cart', $headers)->assertJson(['subtotal_cents' => 0]);
    }

    public function test_it_rejects_checkout_with_an_empty_cart(): void
    {
        $headers = $this->actAsCustomer();

        $this->postJson('/api/checkout', $this->address, $headers)->assertStatus(422);
    }

    public function test_it_fails_when_payment_is_declined(): void
    {
        $headers = $this->actAsCustomer();
        $product = $this->product();

        $this->app->instance(
            \App\Features\Checkout\Payment\PaymentGateway::class,
            new class implements \App\Features\Checkout\Payment\PaymentGateway {
                public function charge(int $amountCents): \App\Features\Checkout\Payment\PaymentResult
                {
                    return new \App\Features\Checkout\Payment\PaymentResult(false, 'declined');
                }
            },
        );

        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1], $headers);

        $this->postJson('/api/checkout', $this->address, $headers)->assertStatus(422);
        $this->assertSame(10, $product->fresh()->stock);
    }

    public function test_it_lists_orders_for_the_user(): void
    {
        $headers = $this->actAsCustomer();
        $product = $this->product();

        $this->postJson('/api/cart/items', ['product_id' => $product->id, 'quantity' => 1], $headers);
        $this->postJson('/api/checkout', $this->address, $headers);

        $this->getJson('/api/orders', $headers)
            ->assertOk()
            ->assertJsonCount(1);
    }
}
