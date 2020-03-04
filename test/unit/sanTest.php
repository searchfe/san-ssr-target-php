<?php
require_once(__DIR__ . '/../../runtime/san.php');
require_once(__DIR__ . '/../../runtime/underscore.php');

use PHPUnit\Framework\TestCase;

final class SanSSRDataTest extends TestCase
{
    public function testGet(): void
    {
        $ctx = (object)[
            "data" => ["foo" => "FOO"],
            "computedNames" => []
        ];
        $data = new SanSSRData($ctx);

        $this->assertEquals($data->get('foo'), 'FOO');
    }
}
