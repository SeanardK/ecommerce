<?php

namespace App\Features\Admin;

use Illuminate\Http\Request;

class AdminImageController
{
    public function store(Request $request)
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);

        $path = $request->file('image')->store('products', 'public');

        return response()->json(['url' => '/storage/'.$path], 201);
    }
}
