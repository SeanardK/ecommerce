<?php

namespace App\Features\Catalog;

use App\Features\Catalog\Models\Category;
use App\Features\Catalog\Models\Product;
use Illuminate\Http\Request;

class CatalogController
{
    public function categories()
    {
        return Category::orderBy('name')->get(['id', 'name', 'slug']);
    }

    public function products(Request $request)
    {
        $query = Product::query()->where('active', true);

        if ($request->filled('category')) {
            $query->whereHas('category', fn ($q) => $q->where('slug', $request->string('category')));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%'.$request->string('search').'%');
        }

        $perPage = min((int) $request->integer('per_page', 12), 50);

        return $query->orderBy('name')->paginate($perPage);
    }

    public function show(string $slug)
    {
        return Product::with('category:id,name,slug')
            ->where('slug', $slug)
            ->where('active', true)
            ->firstOrFail();
    }
}
