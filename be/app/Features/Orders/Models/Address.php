<?php

namespace App\Features\Orders\Models;

use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    protected $fillable = [
        'order_id',
        'line1',
        'line2',
        'city',
        'region',
        'postal_code',
        'country',
    ];
}
