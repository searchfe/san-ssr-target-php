#!/usr/bin/env php
<?php
include(__DIR__ . '/../dist/index.php');

$data = json_decode(file_get_contents(__DIR__ . "/../data.json"), true);
$noDataOutput = false;
$html = \demo\src\index\render($data, $noDataOutput);

echo $html;
