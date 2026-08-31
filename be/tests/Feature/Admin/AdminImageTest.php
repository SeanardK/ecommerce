<?php

namespace Tests\Feature\Admin;

use App\Features\Auth\AuthenticatedUser;
use App\Features\Auth\Contracts\TokenVerifier;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeTokenVerifier;
use Tests\TestCase;

class AdminImageTest extends TestCase
{
    private function actAs(array $roles): array
    {
        $this->app->instance(
            TokenVerifier::class,
            (new FakeTokenVerifier())->withUser(
                'token',
                new AuthenticatedUser('user-1', 'user@test.com', $roles),
            ),
        );

        return ['Authorization' => 'Bearer token'];
    }

    public function test_non_admin_cannot_upload_an_image(): void
    {
        Storage::fake('public');
        $headers = $this->actAs(['customer']);

        $this->post('/api/admin/products/images', [
            'image' => UploadedFile::fake()->create('photo.jpg', 10, 'image/jpeg'),
        ], $headers)->assertForbidden();
    }

    public function test_admin_uploads_an_image_and_gets_a_url(): void
    {
        Storage::fake('public');
        $headers = $this->actAs(['admin']);

        $response = $this->post('/api/admin/products/images', [
            'image' => UploadedFile::fake()->create('photo.jpg', 10, 'image/jpeg'),
        ], $headers)->assertCreated();

        $url = $response->json('url');
        $this->assertStringStartsWith('/storage/products/', $url);
        $this->assertCount(1, Storage::disk('public')->files('products'));
    }

    public function test_upload_rejects_a_non_image_file(): void
    {
        Storage::fake('public');
        $headers = $this->actAs(['admin']);

        $this->post('/api/admin/products/images', [
            'image' => UploadedFile::fake()->create('notes.pdf', 10, 'application/pdf'),
        ], array_merge($headers, ['Accept' => 'application/json']))
            ->assertStatus(422);
    }

    public function test_upload_rejects_a_file_over_the_size_limit(): void
    {
        Storage::fake('public');
        $headers = $this->actAs(['admin']);

        $this->post('/api/admin/products/images', [
            'image' => UploadedFile::fake()->create('big.jpg', 3000, 'image/jpeg'),
        ], array_merge($headers, ['Accept' => 'application/json']))
            ->assertStatus(422);
    }
}
