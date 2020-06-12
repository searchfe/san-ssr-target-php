exports = module.exports = function (data, noDataOutput) {
    var sanssrRuntime = {};
    !(function (exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const BASE_PROPS = {
            'class': 1,
            'style': 1,
            'id': 1
        };
        function extend(target, source) {
            if (!source)
                return target;
            Object.keys(source).forEach(function (key) {
                target[key] = source[key];
            });
            return target;
        }
        function includes(array, value) {
            if (!array)
                return false;
            for (let i = 0; i < array.length; i++) {
                if (array[i] === value)
                    return true;
            }
            return false;
        }
        const HTML_ENTITY = {
            /* jshint ignore:start */
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            /* eslint-disable quotes */
            "'": '&#39;'
            /* eslint-enable quotes */
            /* jshint ignore:end */
        };
        function escapeHTML(source) {
            if (source == null)
                return '';
            if (typeof source === 'string') {
                return source.replace(/[&<>"']/g, (c) => HTML_ENTITY[c]);
            }
            return '' + source;
        }
        function _classFilter(source) {
            return source instanceof Array ? source.join(' ') : source;
        }
        function isObject(source) {
            return typeof source === 'object' && source !== null;
        }
        function _styleFilter(source) {
            if (isObject(source)) {
                return Object.keys(source)
                    .map(key => key + ':' + source[key] + ';')
                    .join('');
            }
            return source;
        }
        function _xclassFilter(outer, inner) {
            if (outer instanceof Array)
                outer = outer.join(' ');
            if (outer) {
                if (inner)
                    return inner + ' ' + outer;
                return outer;
            }
            return inner;
        }
        function _xstyleFilter(outer, inner) {
            outer = outer && defaultStyleFilter(outer);
            if (outer) {
                if (inner)
                    return inner + ';' + outer;
                return outer;
            }
            return inner;
        }
        function attrFilter(name, value, needHTMLEscape) {
            if (value) {
                return ' ' + name + '="' + (needHTMLEscape ? escapeHTML(value) : value) + '"';
            }
            if (value != null && !BASE_PROPS[name]) {
                return ' ' + name + '="' + value + '"';
            }
            return '';
        }
        function boolAttrFilter(name, value) {
            return value ? ' ' + name : '';
        }
        function defaultStyleFilter(source) {
            if (isObject(source)) {
                return Object.keys(source)
                    .map(key => key + ':' + source[key] + ';')
                    .join('');
            }
            return source;
        }
        function createFromPrototype(proto) {
            function Creator() { }
            Creator.prototype = proto;
            return new Creator();
        }
        exports._ = {
            escapeHTML, defaultStyleFilter, boolAttrFilter, attrFilter, extend, includes, _classFilter, _styleFilter, _xstyleFilter, _xclassFilter, createFromPrototype
        };
        //# sourceMappingURL=underscore.js.map
    })(sanssrRuntime);
    !(function (exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        /**
         * SSR 期间的 Data 实现，替代 import('san').SanData
         *
         * * 不涉及视图更新
         * * 便于编译期优化
         */
        class SanData {
            constructor(data, computed) {
                this.data = data;
                this.computed = computed;
            }
            get(path) {
                if (arguments.length === 0)
                    return this.data;
                if (this.computed[path])
                    return this.computed[path].call({ data: this });
                return this.parseExpr(path).reduce((val, name) => val == null ? val : val[name], this.data);
            }
            set(path, value) {
                const seq = this.parseExpr(path);
                let parent = this.data;
                for (let i = 0; i < seq.length - 1; i++) {
                    const name = seq[i];
                    if (parent[name]) {
                        parent = parent[name];
                    }
                    else {
                        return null;
                    }
                }
                parent[seq.pop()] = value;
                return value;
            }
            removeAt(path, index) {
                const value = this.get(path);
                if (value && value.splice)
                    value.splice(index, 1);
            }
            parseExpr(expr) {
                return expr.split('.');
            }
        }
        exports.SanData = SanData;
        //# sourceMappingURL=san-data.js.map
    })(sanssrRuntime);
    sanssrRuntime.prototype1 = {
        filters: {
        },
        computed: {
        },
        tagName: "a"
    }
    sanssrRuntime.renderer1 = function (data = {}, noDataOutput, sanssrRuntime, ownerCtx, parentCtx, tagName, sourceSlots) {
        var _ = sanssrRuntime._;
        var SanData = sanssrRuntime.SanData;
        var html = "";
        var ctx = {
            instance: _.createFromPrototype(sanssrRuntime.prototype1),
            sourceSlots: sourceSlots,
            data: data,
            owner: ownerCtx,
            computedNames: [],
            slotRenderers: {}
        }
        var currentCtx = ctx;
        ctx.instance.data = new SanData(ctx.data, ctx.instance.computed)
        ctx.instance.parentComponent = parentCtx && parentCtx.instance
        var computedNames = ctx.computedNames;
        for (var $i = 0; $i < computedNames.length; $i++) {
            var $computedName = computedNames[$i];
            data[$computedName] = ctx.instance.computed[$computedName].apply(ctx.instance);
        }
        html += "<a";
        html += _.attrFilter("class", (_.escapeHTML(_._classFilter(ctx.data.class))));
        html += _.attrFilter("style", (_.escapeHTML(_._styleFilter(ctx.data.style))));
        html += _.attrFilter("id", ctx.data.id, true);
        html += "><span>aaa</span>";
        html += ("hello ") + (ctx.data.name) + ("!");
        html += "<b>bbb</b></a>";
        return html;
    }
    return sanssrRuntime.renderer1(data, noDataOutput, sanssrRuntime)
}