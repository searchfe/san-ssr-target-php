<?php
class Timing {
    function durationStr() {
        return number_format($this->millisecond(), 3) . 'ms';
    }
    function diffStr($base) {
        $diff = ($this->millisecond() - $base->millisecond()) / $base->millisecond();
        return ($diff >= 0 ? "+" : "-") . number_format(abs($diff) * 100, 3) . '%';
    }
    function end() {
        $this->end = microtime(true);
    }
    function __construct() {
        $this->begin = microtime(true);
    }
    function millisecond() {
        return ($this->end - $this->begin) * 1000;
    }
}
?>
