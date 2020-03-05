<?php
$data = [ "items" => [] ];
for ($i = 0; $i < 10000; $i++) array_push($data['items'], $i);

$times = 200;
echo "----- Simple List SSR Perf (10000 items x $times times) -----\n";

// Smarty
require_once(__DIR__ . '/../../vendor/smarty/smarty/libs/Smarty.class.php');
$smarty = new Smarty;
foreach ($data as $key => $val) $smarty->assign($key, $val);

$begin = microtime(true);
for ($i = 0; $i < $times; $i++) {
    $smarty->fetch(__DIR__ . '/simple-list.tpl');
}
$end = microtime(true);
$diff = ($end - $begin) * 1000;
echo "smarty:\t$diff ms\n";

// San
require_once(__DIR__ . '/simple-list.san.php');
$begin = microtime(true);
for ($i = 0; $i < $times; $i++) {
    \san\simpleList\renderer\render($data, false);
}
$end = microtime(true);
$diff = ($end - $begin) * 1000;
echo "san:\t$diff ms\n";

// San with item as component
require_once(__DIR__ . '/simple-list-child-component.san.php');
$begin = microtime(true);
for ($i = 0; $i < $times; $i++) {
    \san\simpleListChildComponent\renderer\render($data, false);
}
$end = microtime(true);
$diff = ($end - $begin) * 1000;
echo "san (item as component):\t$diff ms\n";

echo "\n";
