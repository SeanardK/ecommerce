<?php

namespace App\Features\Admin;

use App\Features\Catalog\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminProductController
{
    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);

        return response()->json(Product::create($data), 201);
    }

    public function update(Request $request, int $product)
    {
        $model = Product::findOrFail($product);
        $data = $this->validated($request);
        $data['slug'] = Str::slug($data['name']);
        $model->update($data);

        return $model;
    }

    public function destroy(int $product)
    {
        Product::findOrFail($product)->delete();

        return response()->noContent();
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request): array
    {
        return $request->validate([
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string'],
            'description' => ['required', 'string'],
            'price_cents' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'active' => ['required', 'boolean'],
        ]);
    }
}
