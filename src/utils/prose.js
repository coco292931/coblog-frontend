/**
 * 正文增强
 *
 * 正文是后端返回的 HTML 字符串、由 `v-html` 渲染，模板里没法给它插组件，
 * 所以只能在渲染完成后遍历一次真实 DOM 做「事后加工」。
 * 目前负责代码块（语言标签 + 复制按钮），后续的公式渲染也挂在这里。
 *
 * 调用必须幂等：正文每次变化都会重新调用（文章页换文章、写作页预览重渲染）。
 */

const COPIED_MS = 1500;

const ICON_COPY = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
</svg>`;

const ICON_COPIED = `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"></polyline>
</svg>`;

// 复制按钮的复位定时器：放 WeakMap 里，不往 DOM 节点上挂自定义属性
const resetTimers = new WeakMap();

/** 代码语言来自 goldmark 写出的 `class="language-go"` */
const readLanguage = (code) => {
    const match = /(?:^|\s)language-([\w+#.-]+)/.exec(code.className || '');
    return match ? match[1].toLowerCase() : '';
};

/**
 * 复制文本。优先用异步剪贴板 API；它只在安全上下文（https / localhost）可用，
 * 若是通过 http 访问站点，则退回 execCommand，避免按钮点了没反应。
 */
const copyText = async (text) => {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // 未授权或被浏览器策略拒绝时，继续尝试兜底方案
        }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    // 必须留在文档流里且可选中，display:none 的元素选不中
    textarea.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
    document.body.appendChild(textarea);
    textarea.select();

    let copied = false;
    try {
        copied = document.execCommand('copy');
    } catch {
        copied = false;
    }
    textarea.remove();
    return copied;
};

/** 复制成功：换成对勾图标，1.5s 后还原（图标切换由 CSS 的 .is-copied 决定） */
const markCopied = (button) => {
    button.classList.add('is-copied');
    clearTimeout(resetTimers.get(button));
    resetTimers.set(button, setTimeout(() => {
        button.classList.remove('is-copied');
        resetTimers.delete(button);
    }, COPIED_MS));
};

/**
 * 给一个代码块套上定位容器并追加工具条：左侧语言标签，右侧复制按钮。
 * 工具条不能放进 <pre>/<code> 内部 —— pre 的内容模型不接受块级元素，
 * 放进 code 里则会被复制（textContent）与行内代码样式一起带上。
 */
const decorateCodeBlock = (pre) => {
    const code = pre.querySelector('code');
    if (!code) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'code-block';
    pre.replaceWith(wrapper);
    wrapper.appendChild(pre);

    const toolbar = document.createElement('div');
    toolbar.className = 'code-toolbar';

    const language = readLanguage(code);
    if (language) {
        const label = document.createElement('span');
        label.className = 'code-lang';
        label.textContent = language;
        toolbar.appendChild(label);
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'code-copy';
    button.title = '复制代码';
    button.setAttribute('aria-label', '复制代码');
    button.innerHTML = `<span class="code-copy-icon">${ICON_COPY}</span>`
        + `<span class="code-copy-icon">${ICON_COPIED}</span>`;
    button.addEventListener('click', async () => {
        // 工具条在 <pre> 之外，这里取到的就是纯代码
        if (await copyText(code.textContent)) markCopied(button);
    });
    toolbar.appendChild(button);

    wrapper.appendChild(toolbar);
};

/** 给容器里所有代码块补上工具条（幂等：已经加工过的跳过） */
const enhanceCodeBlocks = (root) => {
    root.querySelectorAll('pre').forEach((pre) => {
        if (!pre.parentElement?.classList.contains('code-block')) decorateCodeBlock(pre);
    });
};

/**
 * LaTeX 公式。
 * 后端只输出占位元素（.math-inline / .math-block，内容是原始 TeX），排版在这里完成。
 * KaTeX 的 JS + CSS + 字体加起来不小，而多数文章没有公式，所以按需加载。
 */
let katexPromise = null;

const loadKatex = () => {
    katexPromise ??= Promise.all([
        import('katex'),
        import('katex/dist/katex.min.css'),
    ]).then(([katex]) => katex.default);
    return katexPromise;
};

const renderFormulas = async (root) => {
    const formulas = [...root.querySelectorAll(
        '.math-inline:not([data-math-rendered]), .math-block:not([data-math-rendered])',
    )];
    if (!formulas.length) return;

    const katex = await loadKatex();
    formulas.forEach((element) => {
        const tex = element.textContent;
        // 先打标记再渲染：渲染会把元素内容换成 KaTeX 的输出，
        // 若中途重入，textContent 已经不是原始 TeX 了
        element.dataset.mathRendered = '1';
        try {
            katex.render(tex, element, {
                displayMode: element.classList.contains('math-block'),
                // 语法写错时把原始 TeX 显示出来，而不是让整篇正文报错
                throwOnError: false,
            });
        } catch (error) {
            element.textContent = tex;
            console.warn('公式渲染失败：', tex, error);
        }
    });
};

/**
 * 对正文容器做一次增强（幂等）。
 * 正文每次变化都会重新调用（文章页换文章、写作页预览重渲染）。
 * @param {HTMLElement|null|undefined} root 承载 v-html 的元素
 * @returns {Promise<void>}
 */
export const enhanceProse = async (root) => {
    if (!root) return;

    enhanceCodeBlocks(root);
    try {
        await renderFormulas(root);
    } catch (error) {
        console.warn('公式模块加载失败：', error);
    }
};
