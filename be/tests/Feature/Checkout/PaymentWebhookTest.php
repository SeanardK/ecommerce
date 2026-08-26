<?php

namespace Tests\Feature\Checkout;

use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use App\Features\Orders\Models\Order;
use App\Features\Orders\Models\OrderItem;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET = 'test-webhook-secret';

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('shop.payment_webhook_secret', self::SECRET);
    }

    private function pendingOrder(int $stock = 5): Order
    {
        $category = Category::create(['name' => 'Audio', 'slug' => 'audio']);
        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Headphones',
            'slug' => 'headphones',
            'description' => 'desc',
            'price_cents' => 1000,
            'stock' => $stock,
            'active' => true,
        ]);

        $order = Order::create([
            'user_id' => 'customer-1',
            'status' => 'pending',
            'subtotal_cents' => 1000,
            'tax_cents' => 100,
            'total_cents' => 1100,
            'payment_reference' => 'mock_ref_1',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'quantity' => 2,
            'unit_price_cents' => 1000,
        ]);

        return $order;
    }

    private function postWebhook(array $payload, ?string $secret = self::SECRET): \Illuminate\Testing\TestResponse
    {
        $body = json_encode($payload);
        $headers = ['Content-Type' => 'application/json', 'Accept' => 'application/json'];

        if ($secret !== null) {
            $headers['X-Signature'] = hash_hmac('sha256', $body, $secret);
        }

        return $this->call('POST', '/api/webhooks/payment', [], [], [], $this->transformHeadersToServerVars($headers), $body);
    }

    public function test_it_rejects_a_request_without_a_valid_signature(): void
    {
        $this->postWebhook(['reference' => 'mock_ref_1', 'event' => 'payment.succeeded'], secret: 'wrong-secret')
            ->assertStatus(401);
    }

    public function test_it_rejects_a_request_with_no_signature_header(): void
    {
        $this->postWebhook(['reference' => 'mock_ref_1', 'event' => 'payment.succeeded'], secret: null)
            ->assertStatus(401);
    }

    public function test_it_marks_a_pending_order_paid_on_success_event(): void
    {
        $order = $this->pendingOrder();

        $this->postWebhook(['reference' => $order->payment_reference, 'event' => 'payment.succeeded'])
            ->assertOk()
            ->assertJson(['status' => 'ok']);

        $this->assertSame('paid', $order->fresh()->status);
    }

    public function test_it_cancels_and_restocks_a_pending_order_on_failed_event(): void
    {
        $order = $this->pendingOrder(stock: 3);
        $product = $order->items->first()->product_id;

        $this->postWebhook(['reference' => $order->payment_reference, 'event' => 'payment.failed'])
            ->assertOk();

        $this->assertSame('cancelled', $order->fresh()->status);
        $this->assertSame(5, Product::find($product)->stock);
    }

    public function test_it_is_idempotent_for_an_already_resolved_order(): void
    {
        $order = $this->pendingOrder();
        $order->update(['status' => 'paid']);

        $this->postWebhook(['reference' => $order->payment_reference, 'event' => 'payment.succeeded'])
            ->assertOk()
            ->assertJson(['status' => 'already_processed']);
    }

    public function test_it_ignores_an_unknown_payment_reference(): void
    {
        $this->postWebhook(['reference' => 'does-not-exist', 'event' => 'payment.succeeded'])
            ->assertOk()
            ->assertJson(['status' => 'ignored']);
    }
}
