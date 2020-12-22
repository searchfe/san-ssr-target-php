<?php
class SanSSRData {
    private $instance;
    private $data;

    public function __construct(&$data, &$instance) {
        $this->instance = &$instance;
        $this->data = &$data;
    }

    public function &get ($path = null) {
        if ($path == null) return $this->data;
        if (property_exists($this->instance, 'computed') &&
            array_key_exists($path, $this->instance::$computed)) {
            return _::callComputed($this->instance, $path);
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