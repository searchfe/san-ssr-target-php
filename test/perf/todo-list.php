<?php
$data = array(
    "todos" => array(),
    "categories" => array(
        array( "id" => 8, "title" => "category8", "color" => "#c23531"),
        array( "id" => 7, "title" => "category7", "color" => "#314656"),
        array( "id" => 6, "title" => "category6", "color" => "#dd8668"),
        array( "id" => 5, "title" => "category5", "color" => "#91c7ae"),
        array( "id" => 4, "title" => "category4", "color" => "#6e7074"),
        array( "id" => 3, "title" => "category3", "color" => "#bda29a"),
        array( "id" => 2, "title" => "category2", "color" => "#44525d"),
        array( "id" => 1, "title" => "category1", "color" => "#c4ccd3")
    )
);
for ($i = 500; $i > 0; $i--) {
    array_push($data["todos"], array(
        "id" => $i,
        "title" => "TodoTitle" . $i,
        "desc" => "Todo Description" . $i,
        "endTime" => 1548149025190,
        "category" => $data["categories"][$i % 8],
        "addTime" => 1548062625190,
        "done" => $i === 100
    ));
}

$times = 200;
echo "----- Todo List SSR Perf (500 items x $times times) -----\n";

// Smarty
require_once(__DIR__ . '/../../vendor/smarty/smarty/libs/Smarty.class.php');
$smarty = new Smarty;
foreach ($data as $key => $val) $smarty->assign($key, $val);

$begin = microtime(true);
for ($i = 0; $i < $times; $i++) {
    $smarty->fetch(__DIR__ . '/todo-list.tpl');
}
$end = microtime(true);
$diff = ($end - $begin) * 1000;
echo "smarty:\t$diff ms\n";

// San
require_once(__DIR__ . '/todo-list.san.php');
$begin = microtime(true);
for ($i = 0; $i < $times; $i++) {
    \san\todoList\renderer\render($data, false);
}
$end = microtime(true);
$diff = ($end - $begin) * 1000;
echo "san:\t$diff ms\n";

echo "\n";
