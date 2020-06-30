<?php
require_once(__DIR__ . '/../../stub/helpers.php');
use \san\helpers\Ts2Php_Date;

function data() {
    return [
        "date" => new Ts2Php_Date(Ts2Php_Date::parse("1983-09-02T16:00:00.000Z"))
    ];
}
