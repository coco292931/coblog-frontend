<template>
    <div class="page-write">
        <NavBar />
        <div class="write-page">
            <h1 class="page-title">{{ isEdit ? '编辑文章' : '写文章' }}</h1>

            <div v-if="loadingArticle" class="loading-container">
                <div class="loading-spinner"></div>
                <p>正在加载文章…</p>
            </div>

            <!-- 元信息 -->
            <template v-else>
                <div class="meta-section">
                    <div class="field">
                        <label>标题 <span class="required">*</span></label>
                        <input v-model="form.title" type="text" placeholder="给文章起个标题" />
                    </div>

                    <div class="field">
                        <label>副标题</label>
                        <input v-model="form.subtitle" type="text" placeholder="可选" />
                    </div>

                    <div class="field">
                        <label>摘要</label>
                        <textarea v-model="form.summary" rows="2" placeholder="列表页展示的简介，留空则自动截取正文"></textarea>
                    </div>

                    <div class="field-row">
                        <div class="field">
                            <label>分类</label>
                            <input v-model="categoriesText" type="text" placeholder="多个用逗号分隔，如：技术, 随笔" />
                        </div>
                        <div class="field">
                            <label>标签</label>
                            <input v-model="tagsText" type="text" placeholder="多个用逗号分隔，如：vue, go" />
                        </div>
                    </div>

                    <div class="field">
                        <label>封面图</label>
                        <div class="cover-row">
                            <input v-model="form.cover_image" type="text" placeholder="图片 URL，或点击右侧上传" />
                            <label class="upload-btn">
                                上传
                                <input type="file" accept="image/*" hidden @change="onCoverUpload" />
                            </label>
                        </div>
                        <img v-if="form.cover_image" :src="resolveImageUrl(form.cover_image)" class="cover-preview"
                            @error="onCoverError" />
                    </div>

                    <div class="field-inline">
                        <label class="checkbox-label">
                            <input v-model="form.is_deep" type="checkbox" />
                            深度文章（仅有深度权限的用户可见）
                        </label>
                    </div>

                    <div class="field-inline">
                        <label class="checkbox-label">
                            <input v-model="form.hidden" type="checkbox" />
                            隐藏文章（对所有人不可见，仅编辑接口可访问）
                        </label>
                    </div>

                    <div class="field-inline">
                        <label class="checkbox-label">
                            <input v-model="form.no_stats" type="checkbox" />
                            不计入站点统计（不影响页脚的总字数与文章数）
                        </label>
                    </div>
                </div>

                <!-- 编辑器 -->
                <div class="editor-section">
                    <div class="editor-toolbar">
                        <div class="toolbar-left">
                            <!-- 导入本地文件（md / html / txt） -->
                            <label class="upload-btn small" title="导入本地 Markdown / HTML 文件">
                                导入文件
                                <input type="file" accept=".md,.markdown,.txt,.html,.htm" hidden
                                    @change="onImportFile" />
                            </label>

                            <!-- 插入图片：支持点击选择、拖拽、粘贴 -->
                            <label class="upload-btn small" :class="{ busy: uploading }">
                                {{ uploading ? '上传中…' : '插入图片' }}
                                <input type="file" accept="image/*" multiple hidden :disabled="uploading"
                                    @change="onContentImageUpload" />
                            </label>

                            <span class="toolbar-hint">也可直接拖拽图片到编辑器，或 Ctrl+V 粘贴</span>
                        </div>

                        <div class="mode-switch">
                            <button :class="{ active: contentType === 'md' }" @click="contentType = 'md'">
                                Markdown
                            </button>
                            <button :class="{ active: contentType === 'html' }" @click="contentType = 'html'">
                                HTML
                            </button>
                        </div>

                        <div class="view-switch">
                            <button :class="{ active: viewMode === 'split' }" @click="viewMode = 'split'"
                                title="左写右看">双栏</button>
                            <button :class="{ active: viewMode === 'edit' }" @click="viewMode = 'edit'"
                                title="专注写作">编辑</button>
                            <button :class="{ active: viewMode === 'preview' }" @click="viewMode = 'preview'"
                                title="只看预览">预览</button>
                        </div>
                    </div>

                    <div class="editor-body" :class="`view-${viewMode}`" @dragover.prevent="onDragOver"
                        @dragleave="onDragLeave" @drop.prevent="onDrop">
                        <div v-show="viewMode !== 'preview'" class="editor-pane">
                            <textarea ref="editorRef" v-model="editorContent" class="editor-input"
                                :placeholder="editorPlaceholder" @paste="onPaste"></textarea>
                            <div class="editor-status">
                                <span>{{ charCount }} 字</span>
                                <span v-if="uploading" class="status-uploading">
                                    正在上传图片 {{ uploadPercent }}%
                                </span>
                            </div>
                        </div>

                        <div v-show="viewMode !== 'edit'" class="preview-pane">
                            <div class="preview-scroll">
                                <div class="article-prose" v-html="previewHtml"></div>
                            </div>
                        </div>

                        <!-- 拖拽遮罩 -->
                        <div v-if="dragging" class="drop-overlay">
                            <div class="drop-inner">松手即可上传图片</div>
                        </div>
                    </div>
                </div>

                <!-- 危险操作区：与主操作区分开，避免误触 -->
                <div v-if="isEdit" class="danger-zone">
                    <div class="danger-info">
                        <div class="danger-title">危险操作</div>
                        <div class="danger-desc">删除后不可恢复，请谨慎操作。</div>
                    </div>
                    <button class="btn btn-danger-outline" :disabled="submitting || deleting"
                        @click="openDeleteConfirm">
                        删除文章
                    </button>
                </div>

                <!-- 操作 -->
                <div class="actions">
                    <div class="action-buttons">
                        <button class="btn btn-ghost" :disabled="submitting || deleting"
                            @click="handleCancel">取消</button>
                        <button class="btn btn-primary" :disabled="submitting || deleting" @click="handleSubmit">
                            {{ submitting ? (isEdit ? '保存中…' : '发表中…') : (isEdit ? '保存修改' : '发表文章') }}
                        </button>
                    </div>
                </div>
            </template>
        </div>
        <Footer />

        <!-- 删除二次确认：必须手动输入文章标题才能确认 -->
        <div v-if="deleteConfirmOpen" class="modal-mask" @click.self="closeDeleteConfirm">
            <div class="modal-card">
                <h3 class="modal-title">删除文章</h3>
                <p class="modal-desc">
                    该操作不可恢复。请输入文章标题以确认删除：<br>
                    <strong class="modal-target">{{ form.title }}</strong>
                </p>
                <input ref="deleteInputRef" v-model="deleteConfirmText" class="modal-input" placeholder="请输入完整标题"
                    @keyup.enter="confirmDelete" />
                <div class="modal-actions">
                    <button class="btn btn-ghost" @click="closeDeleteConfirm">取消</button>
                    <button class="btn btn-danger" :disabled="!titleMatches || deleting" @click="confirmDelete">
                        {{ deleting ? '删除中…' : '确认删除' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import {
    buildArticlePayload,
    createArticle,
    deleteArticle,
    getArticleForEdit,
    renderMarkdown,
    updateArticle,
    uploadImage,
} from '../../api/article.js';
import { toast } from '../../composables/useToast.js';
import './index.css';

const route = useRoute();
const router = useRouter();

// 编辑态：路由带 article_id 时为编辑，否则为发表
const articleId = computed(() => route.params.article_id);
const isEdit = computed(() => !!articleId.value);

// 后端基础地址，用于把相对图片路径补全成可访问 URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const form = ref({
    title: '',
    subtitle: '',
    summary: '',
    cover_image: '',
    is_deep: false,
    hidden: false,
    no_stats: false,
});

const categoriesText = ref('');
const tagsText = ref('');
const contentType = ref('md');
const editorContent = ref('');

// 视图模式：split=双栏对照，edit=专注写作，preview=只看预览
const viewMode = ref('split');

// 上传状态
const uploading = ref(false);
const uploadPercent = ref(0);
const dragging = ref(false);

const previewHtml = ref('');
const submitting = ref(false);
const deleting = ref(false);
const loadingArticle = ref(false);
const editorRef = ref(null);

const editorPlaceholder = computed(() =>
    contentType.value === 'md' ? '在这里用 Markdown 写作…' : '在这里粘贴 HTML…'
);

// 正文字数（不含空白）
const charCount = computed(() => (editorContent.value || '').replace(/\s/g, '').length);

// 把后端返回的相对路径补全为绝对 URL
const resolveImageUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url;
    return API_BASE.replace(/\/$/, '') + url;
};

// 把后端保存的 JSON 数组字符串还原为可编辑文本
const jsonArrayToText = (raw) => {
    if (!raw) return '';
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed.join('，');
        return parsed ? String(parsed) : '';
    } catch {
        // 兼容非 JSON 的历史数据
        return String(raw);
    }
};

// 预览：md 模式调用后端渲染，html 模式直接展示
let previewTimer = null;
const updatePreview = () => {
    if (contentType.value === 'html') {
        previewHtml.value = editorContent.value;
        return;
    }
    // 防抖，避免每次输入都打后端
    clearTimeout(previewTimer);
    previewTimer = setTimeout(async () => {
        if (!editorContent.value.trim()) {
            previewHtml.value = '';
            return;
        }
        try {
            const result = await renderMarkdown(editorContent.value);
            // 该接口直接返回 { html: "..." }
            previewHtml.value = result.html || '';
        } catch (error) {
            console.error('预览渲染失败:', error);
        }
    }, 400);
};

watch([editorContent, contentType], updatePreview);

/**
 * 导入本地文件（.md / .markdown / .txt / .html / .htm）
 * 后端没有通用文件上传接口，这里直接用 FileReader 读入编辑器。
 */
const onImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    // 已有内容时先确认，避免覆盖用户正在写的东西
    if (editorContent.value.trim() && !window.confirm('导入会覆盖当前正文，确定继续吗？')) {
        return;
    }

    try {
        const text = await file.text();
        const isHtml = /\.html?$/i.test(file.name);

        contentType.value = isHtml ? 'html' : 'md';
        editorContent.value = text;
        updatePreview();

        // 顺手用文件名填标题（仅在标题为空时）
        if (!form.value.title.trim()) {
            form.value.title = file.name.replace(/\.[^.]+$/, '');
        }

        toast.success(`已导入 ${file.name}`);
    } catch (error) {
        console.error('导入文件失败:', error);
        toast.error('读取文件失败，请确认文件编码为 UTF-8');
    }
};

// 上传封面
const onCoverUpload = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    const id = toast.loading(`正在上传封面：${file.name}`);
    try {
        const result = await uploadImage(file);
        if (result.code === 200 && result.data) {
            // 封面用原图，避免压缩带来的画质损失
            form.value.cover_image = result.data.url;
            toast.update(id, { type: 'success', text: '封面上传成功' });
        } else {
            toast.update(id, { type: 'error', text: result.msg || '封面上传失败' });
        }
    } catch (error) {
        console.error('封面上传失败:', error);
        toast.update(id, {
            type: 'error',
            text: error.response?.data?.msg || '封面上传失败，请稍后重试',
        });
    }
};

const onCoverError = () => {
    toast.error('封面图无法加载，请检查图片地址');
};

/**
 * 上传单张图片并返回可访问 URL。
 * 返回 null 表示失败（错误已通过 toast 提示）。
 */
const uploadOneImage = async (file, indexLabel = '') => {
    if (!file.type.startsWith('image/')) {
        toast.warning(`${file.name} 不是图片，已跳过`);
        return null;
    }
    // 与后端限制保持一致：10 MiB
    if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} 超过 10MB 上限`);
        return null;
    }

    const loadingId = toast.loading(`正在上传${indexLabel}${file.name}…`);
    try {
        const result = await uploadImage(file);
        if (result.code === 200 && result.data) {
            toast.update(loadingId, { type: 'success', text: `${file.name} 上传成功`, duration: 1600 });
            // 正文里写入原图地址：展示时由后端按 ?thumb=1 换成压缩图，
            // 原图留给「查看原图 / 下载原图」使用。
            return result.data.url;
        }
        toast.update(loadingId, { type: 'error', text: result.msg || `${file.name} 上传失败` });
        return null;
    } catch (error) {
        console.error('图片上传失败:', error);
        toast.update(loadingId, {
            type: 'error',
            text: error.response?.data?.msg || `${file.name} 上传失败`,
        });
        return null;
    }
};

/** 批量上传图片，并按顺序生成插入片段 */
const uploadImages = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    uploading.value = true;
    uploadPercent.value = 0;

    const snippets = [];
    for (let i = 0; i < list.length; i++) {
        const url = await uploadOneImage(list[i], list.length > 1 ? `(${i + 1}/${list.length}) ` : '');
        if (url) {
            snippets.push(contentType.value === 'md'
                ? `![${list[i].name}](${url})`
                : `<img src="${url}" alt="${list[i].name}" />`);
        }
        uploadPercent.value = Math.round(((i + 1) / list.length) * 100);
    }

    if (snippets.length) {
        // 空编辑器时直接放进去，避免留下多余空行
        const prefix = editorContent.value.trim() ? '\n\n' : '';
        insertAtCursor(prefix + snippets.join('\n\n') + '\n');
    }

    uploading.value = false;
    uploadPercent.value = 0;
};

// 点击「插入图片」
const onContentImageUpload = async (e) => {
    const files = e.target.files;
    e.target.value = '';
    await uploadImages(files);
};

// ---- 拖拽上传 ----
const onDragOver = () => {
    dragging.value = true;
};

const onDragLeave = (e) => {
    // 只有真正离开编辑器区域才收起遮罩，避免子元素触发闪烁
    if (!e.currentTarget.contains(e.relatedTarget)) {
        dragging.value = false;
    }
};

const onDrop = async (e) => {
    dragging.value = false;
    const files = e.dataTransfer?.files;
    if (files?.length) {
        await uploadImages(files);
    }
};

// ---- 粘贴上传：剪贴板里若有图片，直接上传 ----
const onPaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    const imageFiles = [];
    for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            const f = item.getAsFile();
            if (f) imageFiles.push(f);
        }
    }

    if (imageFiles.length) {
        e.preventDefault();
        await uploadImages(imageFiles);
    }
};

// 在 textarea 当前光标位置插入文本
const insertAtCursor = (text) => {
    const el = editorRef.value;
    if (!el) {
        editorContent.value += text;
        return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = editorContent.value.slice(0, start);
    const after = editorContent.value.slice(end);
    editorContent.value = before + text + after;

    // 插入后把光标移到插入内容末尾，方便继续写
    nextTick(() => {
        const pos = start + text.length;
        el.focus();
        el.setSelectionRange(pos, pos);
    });
};

// 编辑态：拉取文章原文（含 Markdown）并回填表单
const loadArticle = async () => {
    loadingArticle.value = true;
    try {
        const result = await getArticleForEdit(articleId.value);
        if (result.code !== 200 || !result.data) {
            toast.error(result.msg || '文章加载失败');
            return;
        }

        const data = result.data;
        form.value = {
            title: data.title || '',
            subtitle: data.subtitle || '',
            summary: data.summary || '',
            cover_image: data.cover_image || '',
            is_deep: !!data.is_deep,
            hidden: !!data.hidden,
            no_stats: !!data.no_stats,
        };
        categoriesText.value = jsonArrayToText(data.category);
        tagsText.value = jsonArrayToText(data.tags);

        // Markdown 为单一信源：有原文即按 md 模式编辑，否则按 HTML 编辑
        if (data.md_content) {
            contentType.value = 'md';
            editorContent.value = data.md_content;
        } else {
            contentType.value = 'html';
            editorContent.value = data.content || '';
        }
    } catch (error) {
        console.error('加载文章失败:', error);
        toast.error(error.response?.data?.msg || '文章加载失败，请稍后重试');
    } finally {
        loadingArticle.value = false;
    }
};

// 发表 / 保存修改
const handleSubmit = async () => {
    if (!form.value.title.trim()) {
        toast.warning('请填写标题');
        return;
    }
    if (!editorContent.value.trim()) {
        toast.warning('正文不能为空');
        return;
    }

    submitting.value = true;

    const payload = buildArticlePayload(
        form.value,
        categoriesText.value,
        tagsText.value,
        contentType.value,
        editorContent.value,
    );

    try {
        const result = isEdit.value
            ? await updateArticle(articleId.value, payload)
            : await createArticle(payload);

        if (result.code === 200 && result.data) {
            toast.success(isEdit.value ? '保存成功，正在跳转…' : '发表成功，正在跳转…');
            const id = result.data.id || articleId.value;
            // 隐藏文章对所有人不可见，详情页会拒绝访问，此时回到列表页更合理
            const target = payload.hidden ? '/articles' : `/articles/${id}`;
            setTimeout(() => router.push(target), 800);
        } else {
            toast.error(result.msg || result.message || (isEdit.value ? '保存失败' : '发表失败'));
        }
    } catch (error) {
        console.error('提交失败:', error);
        const status = error?.response?.status;
        if (status === 401) {
            toast.error('登录已失效，请重新登录');
        } else if (status === 403) {
            toast.error('没有发表文章的权限');
        } else {
            toast.error('提交失败，请稍后重试');
        }
    } finally {
        submitting.value = false;
    }
};

// 删除二次确认：必须手动输入文章标题才能确认
const deleteConfirmOpen = ref(false);
const deleteConfirmText = ref('');
const deleteInputRef = ref(null);

// 输入的标题与当前文章标题完全一致时才允许删除
const titleMatches = computed(() =>
    deleteConfirmText.value.trim() === (form.value.title || '').trim()
);

const openDeleteConfirm = () => {
    deleteConfirmText.value = '';
    deleteConfirmOpen.value = true;
    // 等弹窗渲染后聚焦输入框
    nextTick(() => deleteInputRef.value?.focus());
};

const closeDeleteConfirm = () => {
    deleteConfirmOpen.value = false;
    deleteConfirmText.value = '';
};

// 编辑态：删除当前文章（仅在标题确认通过后调用）
const confirmDelete = async () => {
    if (!titleMatches.value || deleting.value) {
        if (!titleMatches.value) {
            toast.warning('标题不匹配，请完整输入文章标题');
        }
        return;
    }

    deleting.value = true;
    try {
        const result = await deleteArticle(articleId.value);
        if (result.code === 200) {
            deleteConfirmOpen.value = false;
            toast.success('删除成功，正在返回列表…');
            setTimeout(() => router.push('/articles'), 800);
        } else {
            toast.error(result.msg || '删除失败');
        }
    } catch (error) {
        console.error('删除失败:', error);
        toast.error(error.response?.data?.msg || '删除失败，请稍后重试');
    } finally {
        deleting.value = false;
    }
};

// 取消：编辑态回详情页，发表态回首页
const handleCancel = () => {
    if (isEdit.value) {
        router.push(`/articles/${articleId.value}`);
    } else {
        router.push('/');
    }
};

// 监听 article_id：/write 与 /write/:id 是同组件复用，不会重新 mounted，
// 因此初始化必须放在 watch 里（immediate 覆盖首次进入）
watch(articleId, (id) => {
    if (id) {
        loadArticle();
    } else {
        // 从编辑切回发表：重置为空表单
        form.value = {
            title: '',
            subtitle: '',
            summary: '',
            cover_image: '',
            is_deep: false,
            hidden: false,
            no_stats: false,
        };
        categoriesText.value = '';
        tagsText.value = '';
        contentType.value = 'md';
        editorContent.value = '';
    }
}, { immediate: true });
</script>
