<?php

namespace App\Features\Admin;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminImageController
{
    public function store(Request $request)
    {
        $request->validate([
            'image' => ['required', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:2048'],
        ]);

        $path = $request->file('image')->store('products', 'public');

        return response()->json(['url' => Storage::disk('public')->url($path)], 201);
    }
}
