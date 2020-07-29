#!/usr/bin/env php
<?php
error_reporting(E_ALL ^ E_NOTICE);

$caseName = $argv[1];
$caseDir = "node_modules/san-html-cases/src/" . $caseName;
include('test/stub/helpers.php');
include($caseDir . '/component.php');

$data = getData($caseDir);

$noDataOutput = preg_match('/-ndo$/', $caseName);
$renderFunc = '\\san\\' . sanitize($caseName) . '\\component\\render';

echo $renderFunc($data, $noDataOutput);

function sanitize($string) {
    return str_replace('-', '_', $string);
}

function getData($caseDir) {
    $dataFile = $caseDir . '/data.php';
    if (file_exists($dataFile)) {
        require_once($dataFile);
        return data();
    }
    $dataStr = file_get_contents($caseDir . "/data.json");
    return json_decode($dataStr, true);
}
