<?php

namespace Database\Seeders;

use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        $catalog = [
            'Audio' => [
                ['Wireless Headphones', 12900, 25],
                ['Studio Monitor', 34900, 8],
            ],
            'Wearables' => [
                ['Fitness Watch', 19900, 15],
                ['Smart Band', 5900, 40],
            ],
            'Accessories' => [
                ['USB C Cable', 1500, 200],
                ['Laptop Stand', 4900, 30],
            ],
        ];

        foreach ($catalog as $categoryName => $products) {
            $category = Category::create([
                'name' => $categoryName,
                'slug' => Str::slug($categoryName),
            ]);

            foreach ($products as [$name, $price, $stock]) {
                Product::create([
                    'category_id' => $category->id,
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'description' => $name.' built for everyday use.',
                    'price_cents' => $price,
                    'stock' => $stock,
                    'active' => true,
                ]);
            }
        }
    }
}
