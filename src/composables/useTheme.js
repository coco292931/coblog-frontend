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
   也不会被中途打断。不支持 CSS.registerProperty 的浏览器降级为瞬时切换。 */
const THEME_COLOR_VARS = [
    '--color-background',
    '--color-background-soft',
    '--color-background-mute',
    '--color-border',
    '--color-border-hover',
    '--color-heading',
    '--color-text',
    '--color-background-glass',
    '--color-background-overlay',
    '--color-page-bg',
    '--color-page-grad-from',
    '--color-page-grad-to',
    '--color-card-bg',
    '--color-card-soft',
    '--color-text-secondary',
    '--color-text-muted',
    '--color-text-heading',
    '--color-text-subheading',
    '--color-code-inline-bg',
    '--color-code-block-bg',
    '--color-code-block-text',
    '--color-code-block-border',
    '--color-code-toolbar-bg',
    '--color-code-toolbar-bg-hover',
    '--color-code-toolbar-text',
    '--color-code-toolbar-text-hover',
    '--color-code-toolbar-ok-text',
    '--color-divider',
    '--color-shadow',
    '--color-shadow-soft',
    '--color-accent',
    '--color-cyan',
    '--color-cyan-hover',
    '--color-cyan-bright',
    '--color-cyan-soft',
    '--color-cyan-border',
    '--color-cyan-shadow',
    '--color-cyan-grad-from',
    '--color-cyan-grad-to',
    '--color-scrollbar-thumb',
    '--color-scrollbar-thumb-hover',
    '--color-brand',
    '--color-danger',
    '--color-danger-hover',
    '--color-danger-soft',
    '--color-danger-border',
    '--color-danger-shadow',
    '--color-success',
    '--color-warning',
    '--color-warning-soft',
    // 正文链接色（article-prose.css）：亮色是硬编码值、暗色引用 --color-cyan
    '--prose-link',
    '--prose-link-hover',
    '--prose-link-glow',
];

const TRANSITION_MS = 350;

/* 切换期间挂这个类，把各元素**自身**的 transition 关掉（规则见 base.css）。
   时长略长于变量插值，保证摘类时变量早就到位了，否则摘类会让它们瞬间跳一下。 */
const SWITCH_CLASS = 'theme-switching';
const SWITCH_CLASS_MS = 420;
let switchTimer = null;

const canInterpolateVars =
    typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function';

if (canInterpolateVars) {
    for (const name of THEME_COLOR_VARS) {
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
        document.documentElement.style.transition = THEME_COLOR_VARS
            .map((name) => `${name} ${TRANSITION_MS}ms ease`)
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
