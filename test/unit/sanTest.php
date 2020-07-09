<?php
require_once(__DIR__ . '/../../runtime/san.php');
require_once(__DIR__ . '/../../runtime/underscore.php');

use PHPUnit\Framework\TestCase;

final class SanSSRDataTest extends TestCase
{
    public function testGet(): void
    {
        $ctx = (object)[
            "data" => ["foo" => "FOO"]
        ];
        $data = new SanSSRData($ctx, []);

        $this->assertEquals('FOO', $data->get('foo'));
    }

    public function testRemoveAt(): void
    {
        $ctx = (object)[
            "data" => [ "arr" => [1, 2, 3] ]
        ];
        $data = new SanSSRData($ctx, []);
        $data->removeAt('arr', 1);
        $this->assertEquals([1, 3], $data->get('arr'));
    }
}
