import { ref, watchEffect } from 'vue';

const STORAGE_KEY = 'coblog-theme';

function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getSavedTheme() {
    return localStorage.getItem(STORAGE_KEY);
}

// 全局单例，跨组件共享
const theme = ref(getSavedTheme() || getSystemTheme());

watchEffect(() => {
    document.documentElement.setAttribute('data-theme', theme.value);
    localStorage.setItem(STORAGE_KEY, theme.value);
});

/* ── 主题切换的平滑过渡 ────────────────────────────────────────────────
   旧做法：切换瞬间给 html 挂 .theme-transitioning 类，用
   `html.theme-transitioning *` 给"所有元素"挂 0.35s 颜色过渡，400ms 后摘类。
   它有两处会闪：

   ① 末尾跳变（主要问题）：color 是继承属性。给所有元素都挂过渡后，子元素会把
      "父元素正在过渡中的中间值"当作自己的新目标，于是层层重启过渡 ——
      实测第一波 350ms 结束后又冒出第二、第三波，直到 1.8s 才收敛。
      而摘类时刻固定在 400ms，那一刻还有 100+ 个过渡没跑完，被硬取消后
      元素瞬间跳到终值 → 看起来就是"切换快完成时闪一下"。

   ② 页面主背景用的是 linear-gradient，浏览器不对渐变做插值过渡
      （已把这些页面的背景改回纯色 background-color，见各页面 CSS）。

   ③ 只做变量插值还不够：组件自带的 `transition: all 0.2s~0.3s`（本来是给
      hover 用的）会把"变量每帧的新值"当成新目标去追，等于二级滞后 ——
      实测搜索框 630ms、筛选按钮 830ms、排序按钮 523ms 才收敛，而背景 346ms
      就到了，看起来就是"输入框/按钮/列表和背景不同步"。所以切换期间再用
      .theme-switching 把元素自身的过渡临时关掉，让它们即时跟随变量插值。

   新做法：把"颜色变量本身"注册成可插值的 <color> 自定义属性，只给 html 上的
   这些变量挂过渡。这样所有 var(--x) 的使用者（含靠继承拿颜色的子元素）读到的
   都是"同一个正在插值中的值"，一次过渡内同步完成：既不会逐层延迟，
   也不会被中途打断。不支持 CSS.registerProperty 的浏览器降级为瞬时切换。

   ⚠️ 但"中性墨色"（正文/标题/次级文字）绝不能插值。

   原因是个几何问题：亮色主题是"深墨 + 浅底"，暗色主题是"浅墨 + 深底"——
   墨色和底色的明暗关系是反的。两者同时插值，就必须在中途相交。

   把中性墨色改成瞬时切换后，底色独自移动，对比度就变成单调上升：
   墨色跳变的那一帧恰好与底色同亮（看不见），随后底色走开、文字"浮现"出来。
   跳变被低对比度遮住 → 观感上是一次淡入，而不是闪黑。

   强调色（品牌青 / 链接 / 语义色）仍保留插值：它们在两套主题里的亮度接近，
   直接硬跳会看到明显的"色跳"；而且它们多为短标签或图标，
   底色扫过其亮度的那一瞬间比整段正文一起消失要轻得多。 */
const FADE_VARS = [
    // 背景 / 卡片 / 渐变端点
    '--color-background',
    '--color-background-soft',
    '--color-background-mute',
    '--color-background-glass',
    '--color-background-overlay',
    '--color-page-bg',
    '--color-page-grad-from',
    '--color-page-grad-to',
    '--color-card-bg',
    '--color-card-soft',
    // 代码块底色（文字色属于墨色，见下面的说明）
    '--color-code-inline-bg',
    '--color-code-block-bg',
    '--color-code-block-border',
    '--color-code-toolbar-bg',
    '--color-code-toolbar-bg-hover',
    // 描边 / 分隔 / 阴影 / 滚动条
    '--color-border',
    '--color-border-hover',
    '--color-divider',
    '--color-shadow',
    '--color-shadow-soft',
    '--color-scrollbar-thumb',
    '--color-scrollbar-thumb-hover',
    // 装饰性青色（底色/描边/发光/渐变），不是文字
    '--color-cyan-bright',
    '--color-cyan-soft',
    '--color-cyan-border',
    '--color-cyan-shadow',
    '--color-cyan-grad-from',
    '--color-cyan-grad-to',
    // 语义色的底色/描边/发光
    '--color-danger-soft',
    '--color-danger-border',
    '--color-danger-shadow',
    '--color-warning-soft',
    // 强调色（文字/图标/链接）：亮度接近，插值不会闪，硬跳反而有色跳
    '--color-brand',
    '--color-brand-title',
    '--color-brand-ink',
    '--color-brand-glow',
    '--color-accent',
    '--color-cyan',
    '--color-cyan-hover',
    '--color-danger',
    '--color-danger-hover',
    '--color-success',
    '--color-warning',
    '--color-code-toolbar-text',
    '--color-code-toolbar-text-hover',
    '--color-code-toolbar-ok-text',
    // 正文链接色（article-prose.css）
    '--prose-link',
    '--prose-link-hover',
    '--prose-link-glow',
];

/* 以下变量**不进**过渡列表，主题切换时瞬时生效（原因见上）：
     --color-text  --color-text-secondary  --color-text-muted
     --color-text-heading  --color-text-subheading  --color-heading
     --color-code-block-text
   改主题时如果新增了"要在深底上读的正文色"，记得往这里加而不是加进 FADE_VARS。 */

const TRANSITION_MS = 300;

/* 参与过渡的颜色用一条「先快后慢」的曲线：
   中性墨色跳变的那一帧与旧底色同亮、文字暂时看不见，底色必须**尽快**离开这个亮度。
   但也不能一味求快 —— 曲线太陡会让底色自己"跳一下"。*/
const FADE_EASING = 'cubic-bezier(0.1, 0.75, 0.15, 1)';

/* 切换期间挂这个类，把各元素**自身**的 transition 关掉（规则见 base.css）。
   时长略长于变量插值（300ms），保证摘类时变量早就到位了，否则摘类会让它们瞬间跳一下。 */
const SWITCH_CLASS = 'theme-switching';
const SWITCH_CLASS_MS = 380;
let switchTimer = null;

const canInterpolateVars =
    typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function';

if (canInterpolateVars) {
    for (const name of FADE_VARS) {
        try {
            CSS.registerProperty({
                name,
                syntax: '<color>',
                inherits: true,
                initialValue: 'rgba(0, 0, 0, 0)',
            });
        } catch {
            // HMR 下重复注册会抛错，忽略即可
        }
    }

    // 等首帧之后再挂过渡：否则初始化写 data-theme（读上次选择或跟随系统）时
    // 也会被算作"变化"，暗色用户会看到首屏由亮变暗。
    requestAnimationFrame(() => {
        document.documentElement.style.transition = FADE_VARS
            .map((name) => `${name} ${TRANSITION_MS}ms ${FADE_EASING}`)
            .join(', ');
    });
}

export function useTheme() {
    const toggle = () => {
        const root = document.documentElement;
        root.classList.add(SWITCH_CLASS);
        if (switchTimer) window.clearTimeout(switchTimer);
        switchTimer = window.setTimeout(() => {
            root.classList.remove(SWITCH_CLASS);
            switchTimer = null;
        }, SWITCH_CLASS_MS);

        theme.value = theme.value === 'dark' ? 'light' : 'dark';
    };

    return { theme, toggle };
}
