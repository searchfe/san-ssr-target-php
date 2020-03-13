<?php
require_once(__DIR__ . '/timing.class.php');

$data = [ "items" => [] ];
for ($i = 0; $i < 1000; $i++) array_push($data['items'], $i);

$times = 200;
echo "----- Child Template SSR Perf (1000 items x $times times) -----\n";

// Smarty
require_once(__DIR__ . '/../../vendor/smarty/smarty/libs/Smarty.class.php');
$smarty = new Smarty;
foreach ($data as $key => $val) $smarty->assign($key, $val);

$base = new Timing();
for ($i = 0; $i < $times; $i++) {
    $smarty->fetch(__DIR__ . '/child-template.tpl');
}
$base->end();
echo "smarty:\t" . $base->durationStr() . "\n";

// San
require_once(__DIR__ . '/child-template.san.php');
$timing = new Timing();
for ($i = 0; $i < $times; $i++) {
    \san\childTemplate\renderer\render($data, false);
}
$diff = number_format(($time - $time0) / 100, 3);
$timing->end();
echo "san:\t" . $timing->durationStr() . "\t" . $timing->diffStr($base) . "\n";

echo "\n";
