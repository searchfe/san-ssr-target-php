<?php
class SanSSRData {
    private $ctx;
    private $data;
    private $computedNames;

    public function __construct(&$ctx) {
        $this->ctx = &$ctx;
        $this->data = &$ctx->data;
        $this->computedNames = array_flip($ctx->computedNames);
    }

    public function &get ($path) {
        if (array_key_exists($path, $this->computedNames)) {
            return _::callComputed($this->ctx, $path);
        }
        $seq = $this->parseExpr($path);
        $val = &$this->data;
        foreach ($seq as $name) $val = &$val[$name];
        return $val;
    }

    public function set ($path, $val) {
        $seq = $this->parseExpr($path);
        $parent = &$this->data;
        for ($i = 0; $i < count($seq) - 1; $i++) {
            $name = $seq[$i];
            $parent = &$parent[$name];
        }
        $key = end($seq);
        $parent[$key] = $val;
        return $val;
    }

    public function removeAt ($path, $index) {
        $val = &$this->get($path);
        if (!$val) return;
        array_splice($val, $index, 1);
    }

    private function parseExpr ($expr) {
        return explode(".", $expr);
    }
}

class SanSSRComponent {
    public $data;
    public function __construct () {}
}