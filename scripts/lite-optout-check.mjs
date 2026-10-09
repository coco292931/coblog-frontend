// 回归检查：把 index.html 里那段真实的内联脚本抽出来，在 vm 里用各种
// UA / URL / cookie 组合跑一遍，确认跳转与 cookie 写入符合预期。
//
// 重点是「老设备误触完整版后能回来」这条链路：
//   ?full=1 写 optout（只 6 小时）→ ?lite=1 删 optout 并回 /lite。
//
// 用法：node scripts/lite-optout-check.mjs
import { readFileSync } from 'fs';
import vm from 'vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

const KINDLES = [
  'Mozilla/5.0 (X11; U; Linux armv7l like Android; en-US) AppleWebKit/534.26+ (KHTML, like Gecko) Version/5.0 Safari/534.26+ Kindle/3.0+',
];
const OLD_KINDLE = KINDLES[0];
const DESKTOP =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const NEW_KINDLE =
  'Mozilla/5.0 (Linux; Android 9; KFONWI Build/PS7326) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0 Safari/537.36';

function run(ua, pathname, search, cookie) {
  const out = { replace: null, setCookie: null, className: '' };
  const ctx = {
    navigator: { userAgent: ua },
    location: {
      pathname,
      search,
      replace: (u) => {
        out.replace = u;
      },
    },
    document: {
      documentElement: {
        get className() {
          return out.className;
        },
        set className(v) {
          out.className = v;
        },
      },
      get cookie() {
        return cookie;
      },
      set cookie(v) {
        out.setCookie = v;
      },
    },
  };
  vm.createContext(ctx);
  vm.runInContext(script, ctx);
  return out;
}

const cases = [
  ['老 Kindle 访问首页', OLD_KINDLE, '/', '', '', '/lite/'],
  ['老 Kindle 访问文章', OLD_KINDLE, '/articles/1', '', '', '/lite/articles/1'],
  ['老 Kindle 已在 /lite', OLD_KINDLE, '/lite/articles/1', '', '', null],
  [
    '老 Kindle 点「切换到完整版」',
    OLD_KINDLE,
    '/',
    '?full=1',
    '',
    null,
    'coblog-lite-optout=1; path=/; max-age=21600',
  ],
  [
    '老 Kindle 带着 optout 再来',
    OLD_KINDLE,
    '/articles/1',
    '',
    'coblog-lite-optout=1',
    null,
  ],
  [
    '老 Kindle 带 optout 点「切回精简版」',
    OLD_KINDLE,
    '/articles/1',
    '?lite=1',
    'coblog-lite-optout=1',
    '/lite/articles/1',
    'coblog-lite-optout=; path=/; max-age=0',
  ],
  [
    '老 Kindle 没 optout 也点回精简版',
    OLD_KINDLE,
    '/',
    '?lite=1',
    '',
    '/lite/',
    'coblog-lite-optout=; path=/; max-age=0',
  ],
  ['桌面 Chrome 不受影响', DESKTOP, '/', '', '', null],
  [
    '桌面 Chrome 点回精简版（显式指令照样生效）',
    DESKTOP,
    '/me',
    '?lite=1',
    '',
    '/lite/me',
    'coblog-lite-optout=; path=/; max-age=0',
  ],
  ['新代 Kindle 不跳', NEW_KINDLE, '/', '', '', null],
  [
    '老 Kindle 带 optout 且有其他动态参数',
    OLD_KINDLE,
    '/',
    '?t=123',
    'coblog-lite-optout=1',
    null,
  ],
  [
    '?lite=2 不应误判',
    OLD_KINDLE,
    '/',
    '?lite=2',
    'coblog-lite-optout=1',
    null,
  ],
  [
    '?full=1 藏在中间也要认',
    OLD_KINDLE,
    '/',
    '?a=1&full=1&b=2',
    '',
    null,
    'coblog-lite-optout=1; path=/; max-age=21600',
  ],
];

let failed = 0;
for (const [name, ua, path, search, cookie, wantReplace, wantCookie] of cases) {
  const got = run(ua, path, search, cookie);
  const okReplace = (got.replace ?? null) === (wantReplace ?? null);
  const okCookie = (got.setCookie ?? null) === (wantCookie ?? null);
  if (okReplace && okCookie) {
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        replace: got ${got.replace} want ${wantReplace}`);
    console.log(`        cookie : got ${got.setCookie} want ${wantCookie}`);
  }
}

// 「切回简版」救生圈 不能放在 Vue 组件里
const htmlChecks = [
  ['index.html 里有不经过 Vue 的回程 <a>', /<a[^>]+class="lite-back"[^>]*>/.test(html)],
  [
    '回程 <a> 在 #app 之外（Vue 挂载不会换掉它）',
    // ⚠️ 要定位那个 <a> 本身：光搜 'lite-back' 会先命中 <style> 里的 .lite-back，
    // 而样式块本来就在 #app 之前，断言会假通过。
    html.indexOf('<a class="lite-back"') > html.indexOf('<div id="app"></div>'),
  ],
  ['样式默认隐藏', /\.lite-back\s*\{\s*display:\s*none/.test(html)],
  ['只有 .lite-opted-out 时才显示', /\.lite-opted-out\s+\.lite-back\s*\{[^}]*display:\s*block/.test(html)],
  ['Footer.vue 不再掺和这件事', !readFileSync(new URL('../src/components/Footer.vue', import.meta.url), 'utf8').includes('lite-opted-out')],
];

for (const [name, ok] of htmlChecks) {
  if (ok) {
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
  }
}

// 救生圈的开关：有 optout 才给 <html> 挂 .lite-opted-out。
// 桌面 Chrome 也要认 —— 用户可能就是在电脑上点的完整版。
const classCases = [
  ['老 Kindle 带 optout → 挂开关', OLD_KINDLE, '/', '', 'coblog-lite-optout=1', ' lite-opted-out'],
  ['老 Kindle 没 optout → 不挂', OLD_KINDLE, '/', '', '', ''],
  ['桌面 Chrome 带 optout → 也挂', DESKTOP, '/', '', 'coblog-lite-optout=1', ' lite-opted-out'],
  ['已在 /lite 下 → 不处理', OLD_KINDLE, '/lite/', '', 'coblog-lite-optout=1', ''],
];

for (const [name, ua, path, search, cookie, want] of classCases) {
  const got = run(ua, path, search, cookie).className;
  if (got === want) {
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}`);
    console.log(`        className: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);
  }
}

console.log(failed === 0 ? '\n全部通过' : `\n${failed} 个失败`);
process.exit(failed === 0 ? 0 : 1);
