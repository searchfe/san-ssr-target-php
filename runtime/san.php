<?php
class SanData {
    private $ctx;
    private $data;
    private $computedNames;

    public function __construct(&$ctx) {
        $this->ctx = &$ctx;
        $this->data = &$ctx->data;
        $this->computedNames = array_flip($ctx->computedNames);
    }

    public function get ($path) {
        if (array_key_exists($path, $this->computedNames)) {
            return _::callComputed($this->ctx, $path);
        }
        $seq = $this->parseExpr($path);
        $val = $this->data;
        foreach ($seq as $name) {
            if (isset($val->$name)) {
                $val = $val->$name;
            }
            else {
                return null;
            }
        }
        return $val;
    }

    public function set ($path, $val) {
        $seq = $this->parseExpr($path);
        $parent = $this->data;
        for ($i = 0; $i < count($seq) - 1; $i++) {
            $name = $seq[$i];
            if (isset($parent->$name)) {
                $parent = $parent->$name;
            }
            else {
                return null;
            }
        }
        $key = end($seq);
        $parent->$key = $val;
        return $val;
    }

    private function parseExpr ($expr) {
        return explode(".", $expr);
    }
}

class SanComponent {
    public $data;
    public function __construct () {}
}