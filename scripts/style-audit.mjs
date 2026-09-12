#!/usr/bin/env node
/**
 * 样式体检  ——  npm run lint:styles
 *
 * 这个项目的页面 CSS 构建后会被合并成一个文件，类名是全局的，所以有几类
 * 问题特别容易悄悄发生（都是这次重构里真实踩到过的）：
 *
 *   1. 跨文件重复选择器：同一选择器在多个文件里各写一份，同优先级下谁后加载谁赢，
 *      页面实际生效的样式可能来自别的页面。
 *   2. 硬编码颜色：除了 src/assets/base.css（token 定义处）之外，颜色都该走变量，
 *      否则切主题时不会跟着变。
 *   3. 圆角 / 阴影取值发散：目前只做统计，用来观察是否又在各写各的。
 *
 * 只读，不修改任何文件。退出码始终为 0（当体检报告用，不阻塞提交）。
 */
import fs from 'fs';
import path from 'path';

const SRC = path.resolve(process.cwd(), 'src');
const TOKEN_FILE = 'assets/base.css';   // 唯一允许写死颜色的地方（注意用正斜杠，rel 已统一）
const PROP_COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (/\.(css|vue)$/.test(e.name)) out.push(p);
    }
    return out;
}

/** 取出文件的样式文本（.vue 只取 <style> 块，并标出是否 scoped） */
function styleOf(file) {
    const raw = fs.readFileSync(file, 'utf8');
    if (!file.endsWith('.vue')) return { css: raw, scoped: false };
    const blocks = [...raw.matchAll(/<style([^>]*)>([\s\S]*?)<\/style>/g)];
    if (!blocks.length) return null;
    return {
        css: blocks.map(b => b[2]).join('\n'),
        scoped: blocks.some(b => /\bscoped\b/.test(b[1])),
    };
}

const files = walk(SRC);
const selMap = new Map();          // 选择器 -> Set(文件)，仅统计非 scoped（全局）
const hardColors = [];             // { file, line, value }
const radii = new Map();
const shadows = new Map();

for (const file of files) {
    const rel = path.relative(SRC, file).replace(/\\/g, '/');
    const info = styleOf(file);
    if (!info) continue;
    const isTokenFile = rel === TOKEN_FILE;
    // scoped 组件的选择器带 data-v 属性、不会跨文件互相影响，只统计全局样式
    const css = info.css.replace(/\/\*[\s\S]*?\*\//g, '');

    const lines = css.split(/\r?\n/);
    let depth = 0;
    lines.forEach((line, i) => {
        const t = line.trim();
        const opens = (t.match(/\{/g) || []).length;
        const closes = (t.match(/\}/g) || []).length;

        // 只统计「最外层」选择器：嵌套的那些自带父级前缀，不会跨文件撞名；
        // 而且最外层才能反映"两个文件各自定义了一份同名样式"这种问题。
        if (depth === 0 && opens > 0 && !t.startsWith('@') && !/^(from|to)$/.test(t.replace(/\{$/, '').trim())) {
            const sel = t.replace(/\{$/, '').trim();
            if (sel && /^[.#:&a-zA-Z\[]/.test(sel)) {
                if (!selMap.has(sel)) selMap.set(sel, new Set());
                selMap.get(sel).add(rel);
            }
        }
        depth += opens - closes;
        if (depth < 0) depth = 0;

        if (!isTokenFile) {
            // 先剔除 var(...) 里可能出现的颜色，避免误报
            const stripped = line.replace(/var\([^)]*\)/g, '');
            for (const m of stripped.matchAll(PROP_COLOR)) {
                hardColors.push({ file: rel, line: i + 1, value: m[0] });
            }
        }
        for (const m of t.matchAll(/border-radius:\s*([^;]+);/g)) {
            radii.set(m[1].trim(), (radii.get(m[1].trim()) || 0) + 1);
        }
        for (const m of t.matchAll(/box-shadow:\s*([^;]+);/g)) {
            shadows.set(m[1].trim(), (shadows.get(m[1].trim()) || 0) + 1);
        }
    });
}

const dupes = [...selMap.entries()].filter(([, s]) => s.size > 1).sort((a, b) => b[1].size - a[1].size);
const byFile = hardColors.reduce((acc, c) => {
    (acc[c.file] ||= []).push(c);
    return acc;
}, {});

console.log('\n=== 1. 跨文件重复选择器（全局样式） ===');
if (!dupes.length) console.log('  没有 ✅');
for (const [sel, set] of dupes) {
    console.log(`  [${set.size}] ${sel}`);
    console.log(`       ${[...set].join('\n       ')}`);
}

console.log(`\n=== 2. 硬编码颜色（${hardColors.length} 处，已排除 ${TOKEN_FILE} 与 var() 内的值） ===`);
const sorted = Object.entries(byFile).sort((a, b) => b[1].length - a[1].length);
if (!sorted.length) console.log('  没有 ✅');
for (const [file, list] of sorted) {
    console.log(`  ${file}  (${list.length})`);
    console.log(`       ${list.map(c => `L${c.line} ${c.value}`).join(', ')}`);
}

const showTop = (title, map, n = 12) => {
    console.log(`\n=== ${title}（共 ${map.size} 种取值） ===`);
    const rows = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
    for (const [v, c] of rows) console.log(`  ${String(c).padStart(3)}×  ${v}`);
};
showTop('3. border-radius 取值', radii);
showTop('4. box-shadow 取值', shadows);
console.log('');
