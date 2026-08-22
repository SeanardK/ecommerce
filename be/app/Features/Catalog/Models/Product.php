<?php

namespace App\Features\Catalog\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'description',
        'image_url',
        'price_cents',
        'stock',
        'active',
    ];

    protected $casts = [
        'price_cents' => 'integer',
        'stock' => 'integer',
        'active' => 'boolean',
    ];

    protected $hidden = ['created_at', 'updated_at'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
