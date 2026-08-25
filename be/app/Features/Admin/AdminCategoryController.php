<?php

namespace App\Features\Admin;

use App\Features\Catalog\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCategoryController
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string'],
        ]);

        $category = Category::create([
            'name' => $data['name'],
            'slug' => Str::slug($data['name']),
        ]);

        return response()->json($category, 201);
    }

    public function destroy(int $category)
    {
        Category::findOrFail($category)->delete();

        return response()->noContent();
    }
}
