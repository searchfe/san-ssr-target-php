<?php
final class _ {
    public static $HTML_ENTITY;
    public static $BASE_PROPS;
  
    public static function setDefaultData($ctx) {
      $data = $ctx->data;
      $inst = $ctx->instance;

      if (!method_exists($inst, 'initData')) return;

      $initData = $inst->initData();
      foreach ($initData as $key => $val) {
          if (isset($data["$key"])) continue;
          $data["$key"] = $val;
      }
      return $data;
    }

    public static function objSpread($arr, $needSpread) {
        $obj = [];
        foreach ($arr as $idx => $val) {
            if ($needSpread[$idx]) {
                foreach ($val as $subkey => $subvar) {
                    $obj["$subkey"] = $subvar;
                }
            } else {
                $obj["$val[0]"] = $val[1];
            }
        }
        return $obj;
    }

    public static function spread($arr, $needSpread) {
        $ret = [];
        foreach ($arr as $idx => $val) {
            if ($needSpread[$idx]) {
                foreach ($val as $subvar) array_push($ret, $subvar);
            } else {
                array_push($ret, $val);
            }
        }
        return $ret;
    }

    public static function &extend(&$target)
    {
        $numargs = func_num_args();
        $arg_list = func_get_args();
        for ($i = 1; $i < $numargs; $i++) {
            $source = $arg_list[$i];
            if ($source) {
                foreach ($source as $key => $val) {
                    $target["$key"] = $val;
                }
            }
        }
        return $target;
    }

    public static function combine($target, $source)
    {
        if ($source) {
            foreach ($source as $key => $val) {
                $target["$key"] = $val;
            }
        }
        return $target;
    }

    public static function each($array, $iter)
    {
        if (!$array) {
            return;
        }
        foreach ($array as $key => $val) {
            if ($iter($val, $key) === false) {
                break;
            }
        }
    }

    public static function contains($array, $value)
    {
        return in_array($value, $array);
    }

    public static function htmlFilterReplacer($c)
    {
        return _::$HTML_ENTITY[$c];
    }

    // JavaScript toString Implementation
    public static function toString($source) {
        if (!isset($source)) {
            return "undefined";
        }
        if (is_string($source)) {
            return $source;
        }
        if (is_bool($source)) {
            return $source ? 'true' : 'false';
        }
        if (is_array($source)) {
            $arr = [];
            foreach ($source as $item) array_push(_::toString($item));
            return join(",", $arr);
        }
        if (is_object($source)) {
            return _::json_encode($source);
        }
        return strval($source);
    }

    public static function output($source, $needEscape)
    {
        if (!isset($source)) return "";
        $str = _::toString($source);
        return $needEscape ? htmlspecialchars($str, ENT_QUOTES) : $str;
    }

    public static function json_encode ($obj, $flag = 0) {
        return json_encode($obj, $flag | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    public static function log () {
        $numargs = func_num_args();
        $arg_list = func_get_args();
        for ($i = 0; $i < $numargs; $i++) {
            echo _::json_encode($arg_list[$i], JSON_PRETTY_PRINT) . ' ';
        }
        echo "\n";
    }

    public static function classFilter($source)
    {
        if (is_array($source)) {
            return join(" ", $source);
        }
        return $source;
    }

    public static function styleFilter($source)
    {
        return _::stringifyStyles($source);
    }

    public static function xclassFilter($outer, $inner)
    {
        if (is_array($outer)) {
            $outer = join(" ", $outer);
        }
        if ($outer) {
            return $inner ? $inner . ' ' . $outer : $outer;
        }
        return $inner;
    }

    public static function xstyleFilter($outer, $inner)
    {
        if ($outer) {
            $outer = _::stringifyStyles($outer);
            return $inner ? $inner . ';' . $outer : $outer;
        }
        return $inner;
    }

    public static function attrFilter($name, $value, $needEscape = false)
    {
        if (isset($value) && $value) {
            $value = _::output($value, $needEscape);
            return " " . $name . '="' . $value . '"';
        }
        if (isset($value) && !array_key_exists($name, _::$BASE_PROPS)) {
            return " " . $name . '="' . _::toString($value) . '"';
        }
        return '';
    }

    public static function boolAttrFilter($name, $value)
    {
        return isset($value) && $value ? ' ' . $name : '';
    }

    public static function callFilter($ctx, $name, $args)
    {
        $class = get_class($ctx->instance);
        $func = $class::$filters[$name];
        if (is_callable($func)) {
            array_unshift($args, $ctx->instance);
            return call_user_func_array($func, $args);
        }
    }

    public static function callComputed(&$instance, $name)
    {
        $class = get_class($instance);
        $func = $class::$computed[$name];
        if (is_callable($func)) {
            $result = call_user_func($func, $instance);
            return $result;
        }
    }

    public static function getRootContext($ctx) {
        while ($ctx->parentCtx) $ctx = $ctx->parentCtx;
        return $ctx;
    }

    public static function stringifyStyles($source)
    {
        if (is_array($source) || is_object($source)) {
            $result = '';
            foreach ($source as $key => $val) {
                $result .= $key . ':' . $val . ';';
            }
            return $result;
        }
        return $source;
    }
}

_::$HTML_ENTITY = [
    '&' => '&amp;',
    '<' => '&lt;',
    '>' => '&gt;',
    '"' => '&quot;',
    "'" => '&#39;'
];

_::$BASE_PROPS = [
    'class' => 1,
    'style' => 1,
    'id' => 1
];