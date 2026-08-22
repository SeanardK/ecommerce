<?php

namespace App\Features\Orders\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    public const STATUSES = ['pending', 'paid', 'fulfilled', 'completed', 'cancelled'];

    protected $fillable = [
        'user_id',
        'status',
        'subtotal_cents',
        'tax_cents',
        'total_cents',
        'payment_reference',
    ];

    protected $casts = [
        'subtotal_cents' => 'integer',
        'tax_cents' => 'integer',
        'total_cents' => 'integer',
    ];

    protected $hidden = ['updated_at'];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function address(): HasOne
    {
        return $this->hasOne(Address::class);
    }
}
