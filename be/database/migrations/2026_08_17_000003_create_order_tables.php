<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('user_id');
            $table->string('status')->default('pending');
            $table->unsignedInteger('subtotal_cents');
            $table->unsignedInteger('tax_cents');
            $table->unsignedInteger('total_cents');
            $table->string('payment_reference')->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained();
            $table->string('product_name');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('unit_price_cents');
            $table->timestamps();
        });

        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('line1');
            $table->string('line2')->nullable();
            $table->string('city');
            $table->string('region');
            $table->string('postal_code');
            $table->string('country');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
