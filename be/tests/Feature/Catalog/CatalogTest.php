<?php

namespace Tests\Feature\Catalog;

use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogTest extends TestCase
{
    use RefreshDatabase;

    private function seedProduct(string $category, string $name, bool $active = true): Product
    {
        $cat = Category::firstOrCreate(
            ['slug' => str($category)->slug()],
            ['name' => $category],
        );

        return Product::create([
            'category_id' => $cat->id,
            'name' => $name,
            'slug' => str($name)->slug(),
            'description' => 'desc',
            'price_cents' => 1000,
            'stock' => 5,
            'active' => $active,
        ]);
    }

    public function test_it_lists_active_products(): void
    {
        $this->seedProduct('Audio', 'Headphones');
        $this->seedProduct('Audio', 'Hidden', active: false);

        $response = $this->getJson('/api/products')->assertOk();

        $this->assertCount(1, $response->json('data'));
    }

    public function test_it_filters_by_category(): void
    {
        $this->seedProduct('Audio', 'Headphones');
        $this->seedProduct('Wearables', 'Watch');

        $response = $this->getJson('/api/products?category=wearables')->assertOk();

        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Watch', $response->json('data.0.name'));
    }

    public function test_it_shows_a_product_by_slug(): void
    {
        $this->seedProduct('Audio', 'Headphones');

        $this->getJson('/api/products/headphones')
            ->assertOk()
            ->assertJson(['name' => 'Headphones']);
    }

    public function test_it_hides_inactive_products_on_detail(): void
    {
        $this->seedProduct('Audio', 'Hidden', active: false);

        $this->getJson('/api/products/hidden')->assertNotFound();
    }
}
