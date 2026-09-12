/**
 * 样式快照 / 回归对比工具（浏览器端）
 *
 * 用途：改样式之前先 capture() 存一份「所有元素的 computed style」基线，
 *      改完再 summary() 对比，用来证明「只改了预期的东西」。
 *
 * 为什么用 computed style 而不是解析 CSS 源码：
 *   跨文件同名类互相覆盖、!important、媒体查询、嵌套……这些只有浏览器算得对。
 *
 * 用法（配合 Playwright）：
 *   await page.setViewportSize({ width: 1440, height: 900 })   // ⚠️ 视口必须固定，否则尺寸差异会淹没真实变化
 *   await page.goto(URL)
 *   await page.addScriptTag({ url: '<dev-server>/@fs/<abs path>/scripts/style-snapshot.js' })
 *   await page.evaluate(() => window.__styleSnap.capture())    // 改前
 *   ...改代码...
 *   await page.evaluate(() => window.__styleSnap.summary(15))   // 改后
 *
 * 说明：元素 key 只用「DOM 序号 + 标签名」，不含 class，
 *      所以改类名之后仍然能把同一个元素对起来（class 只作为展示信息）。
 */
(function () {
    if (window.__styleSnap) return;

    var PROPS = [
        'color', 'backgroundColor', 'backgroundImage', 'fontSize', 'fontWeight', 'lineHeight',
        'margin', 'padding', 'borderTopWidth', 'borderBottomWidth', 'borderRadius', 'boxShadow',
        'display', 'textAlign', 'opacity', 'width', 'height', 'gap', 'flexDirection',
        'alignItems', 'justifyContent', 'textDecorationLine', 'overflowX', 'position'
    ];

    function keyOf(path, theme) {
        return '__sb__' + path + '__' + theme;
    }

    // 冻结过渡/动画，否则读到的可能是过渡中间值
    function freeze() {
        if (document.querySelector('style[data-snap-freeze]')) return;
        var s = document.createElement('style');
        s.setAttribute('data-snap-freeze', '1');
        s.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
        document.head.appendChild(s);
    }

    function snapshot() {
        var out = {};
        document.querySelectorAll('*').forEach(function (el, i) {
            if (el.hasAttribute('data-snap-freeze')) return;
            var cs = getComputedStyle(el);
            var rec = { cls: (typeof el.className === 'string' ? el.className : el.getAttribute('class')) || '' };
            for (var k = 0; k < PROPS.length; k++) rec[PROPS[k]] = cs[PROPS[k]];
            out[i + '|' + el.tagName.toLowerCase()] = rec;
        });
        return out;
    }

    function bothThemes(visit) {
        freeze();
        var root = document.documentElement;
        var prev = root.getAttribute('data-theme');
        root.setAttribute('data-theme', 'light');
        var light = visit();
        root.setAttribute('data-theme', 'dark');
        var dark = visit();
        if (prev) root.setAttribute('data-theme', prev);
        return { light: light, dark: dark };
    }

    function capture() {
        var res = bothThemes(snapshot);
        var path = location.pathname;
        localStorage.setItem(keyOf(path, 'light'), JSON.stringify(res.light));
        localStorage.setItem(keyOf(path, 'dark'), JSON.stringify(res.dark));
        var bytes = JSON.stringify(res.light).length + JSON.stringify(res.dark).length;
        return { path: path, count: Object.keys(res.light).length, kb: Math.round(bytes / 1024) };
    }

    function compare(baseRaw, cur) {
        var base = JSON.parse(baseRaw || 'null');
        if (!base) return { error: 'no baseline' };
        var keys = Object.keys(base).concat(Object.keys(cur).filter(function (k) { return !(k in base); }));
        var changes = [], added = 0, removed = 0;
        for (var i = 0; i < keys.length; i++) {
            var k = keys[i];
            if (!(k in base)) { added++; continue; }
            if (!(k in cur)) { removed++; continue; }
            var f = [];
            for (var p = 0; p < PROPS.length; p++) {
                if (base[k][PROPS[p]] !== cur[k][PROPS[p]]) {
                    f.push(PROPS[p] + '=' + base[k][PROPS[p]] + '→' + cur[k][PROPS[p]]);
                }
            }
            if (f.length) changes.push({ key: k, cls: cur[k].cls, was: base[k].cls, fields: f });
        }
        return { n: changes.length, added: added, removed: removed, list: changes, baseCount: Object.keys(base).length, curCount: Object.keys(cur).length };
    }

    function diff() {
        var res = bothThemes(snapshot);
        var path = location.pathname;
        var light = compare(localStorage.getItem(keyOf(path, 'light')), res.light);
        var dark = compare(localStorage.getItem(keyOf(path, 'dark')), res.dark);
        return { path: path, light: light, dark: dark };
    }

    function summary(limit) {
        limit = limit || 15;
        var d = diff();
        function fmt(t) {
            if (t.error) return t.error;
            var head = t.n + ' 处变化 / 新增 ' + t.added + ' / 消失 ' + t.removed +
                '（基线 ' + t.baseCount + ' → 现在 ' + t.curCount + '）';
            if (!t.n) return head;
            return head + ' :: ' + t.list.slice(0, limit).map(function (c) {
                return (c.cls || '(无class)') + '[' + c.key + '] ' + c.fields.join(' | ');
            }).join('  ~~  ');
        }
        return { path: d.path, light: fmt(d.light), dark: fmt(d.dark) };
    }

    function clearAll() {
        Object.keys(localStorage).filter(function (k) { return k.indexOf('__sb__') === 0; })
            .forEach(function (k) { localStorage.removeItem(k); });
        return 'cleared';
    }

    window.__styleSnap = { capture: capture, diff: diff, summary: summary, clearAll: clearAll, props: PROPS };
})();
