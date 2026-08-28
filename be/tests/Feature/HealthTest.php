<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_reports_ok_when_the_database_answers(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertJson(['status' => 'ok', 'checks' => ['database' => 'up']]);
    }

    public function test_responses_carry_a_request_id_header(): void
    {
        $response = $this->getJson('/api/health');

        $this->assertNotEmpty($response->headers->get('X-Request-Id'));
    }

    public function test_an_inbound_request_id_is_echoed_back(): void
    {
        $this->getJson('/api/health', ['X-Request-Id' => 'trace-123'])
            ->assertHeader('X-Request-Id', 'trace-123');
    }
}
