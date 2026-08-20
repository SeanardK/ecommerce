<?php

namespace App\Features\Cart\Models;

use App\Features\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CartItem extends Model
{
    protected $fillable = ['cart_id', 'product_id', 'quantity', 'unit_price_cents'];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price_cents' => 'integer',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function lineTotalCents(): int
    {
        return $this->quantity * $this->unit_price_cents;
    }
}
