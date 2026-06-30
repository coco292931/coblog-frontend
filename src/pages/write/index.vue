<template>
    <div class="write-container">
        <NavBar />
        <div class="write-page">
            <h1 class="page-title">写文章</h1>

            <!-- 元信息 -->
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
            </div>

            <!-- 编辑器 -->
            <div class="editor-section">
                <div class="editor-toolbar">
                    <div class="mode-switch">
                        <button :class="{ active: contentType === 'md' }" @click="contentType = 'md'">Markdown</button>
                        <button :class="{ active: contentType === 'html' }" @click="contentType = 'html'">HTML</button>
                    </div>
                    <label class="upload-btn small">
                        插入图片
                        <input type="file" accept="image/*" hidden @change="onContentImageUpload" />
                    </label>
                </div>

                <div class="editor-body">
                    <textarea ref="editorRef" v-model="editorContent" class="editor-input"
                        :placeholder="contentType === 'md' ? '在这里用 Markdown 写作…' : '在这里粘贴 HTML…'"></textarea>
                    <div class="preview" v-html="previewHtml"></div>
                </div>
            </div>

            <!-- 操作 -->
            <div class="actions">
                <span v-if="message" class="message" :class="messageType">{{ message }}</span>
                <button class="submit-btn" :disabled="submitting" @click="handleSubmit">
                    {{ submitting ? '发表中…' : '发表文章' }}
                </button>
            </div>
        </div>
        <Footer />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from '../../components/NavBar.vue';
import Footer from '../../components/Footer.vue';
import { createArticle, uploadImage, renderMarkdown } from '../../api/article.js';
import { isAuthenticated } from '../../utils/auth.js';
import './index.css';

const router = useRouter();

// 后端基础地址，用于把相对图片路径补全成可访问 URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const form = ref({
    title: '',
    subtitle: '',
    summary: '',
    cover_image: '',
    is_deep: false,
});

const categoriesText = ref('');
const tagsText = ref('');
const contentType = ref('md');
const editorContent = ref('');

const previewHtml = ref('');
const submitting = ref(false);
const message = ref('');
const messageType = ref('');
const editorRef = ref(null);

// 把后端返回的相对路径补全为绝对 URL
const resolveImageUrl = (url) => {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url;
    return API_BASE.replace(/\/$/, '') + url;
};

// 逗号分隔字符串 -> 去空白的数组
const splitList = (text) =>
    text.split(/[,，]/).map((s) => s.trim()).filter(Boolean);

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

// 上传封面
const onCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const result = await uploadImage(file);
        if (result.code === 200 && result.data) {
            form.value.cover_image = result.data.url;
        } else {
            showMessage('封面上传失败', 'error');
        }
    } catch (error) {
        console.error('封面上传失败:', error);
        showMessage('封面上传失败', 'error');
    } finally {
        e.target.value = '';
    }
};

const onCoverError = () => {
    showMessage('封面图无法加载，请检查地址', 'error');
};

// 在编辑器光标处插入图片
const onContentImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const result = await uploadImage(file);
        if (result.code === 200 && result.data) {
            const url = result.data.url;
            const snippet = contentType.value === 'md'
                ? `![${file.name}](${url})`
                : `<img src="${url}" alt="${file.name}" />`;
            insertAtCursor(snippet);
        } else {
            showMessage('图片上传失败', 'error');
        }
    } catch (error) {
        console.error('图片上传失败:', error);
        showMessage('图片上传失败', 'error');
    } finally {
        e.target.value = '';
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
};

const showMessage = (msg, type = 'info') => {
    message.value = msg;
    messageType.value = type;
};

// 发表
const handleSubmit = async () => {
    if (!form.value.title.trim()) {
        showMessage('请填写标题', 'error');
        return;
    }
    if (!editorContent.value.trim()) {
        showMessage('正文不能为空', 'error');
        return;
    }

    submitting.value = true;
    showMessage('', '');

    const payload = {
        title: form.value.title.trim(),
        subtitle: form.value.subtitle.trim(),
        summary: form.value.summary.trim(),
        cover_image: form.value.cover_image.trim(),
        category: JSON.stringify(splitList(categoriesText.value)),
        tags: JSON.stringify(splitList(tagsText.value)),
        is_deep: form.value.is_deep,
    };
    if (contentType.value === 'md') {
        payload.md_content = editorContent.value;
    } else {
        payload.content = editorContent.value;
    }

    try {
        const result = await createArticle(payload);
        if (result.code === 200 && result.data) {
            showMessage('发表成功，正在跳转…', 'success');
            setTimeout(() => router.push(`/articles/${result.data.id}`), 800);
        } else {
            showMessage(result.msg || result.message || '发表失败', 'error');
        }
    } catch (error) {
        console.error('发表失败:', error);
        const code = error?.response?.status;
        if (code === 401) {
            showMessage('登录已失效，请重新登录', 'error');
        } else if (code === 403) {
            showMessage('没有发表文章的权限', 'error');
        } else {
            showMessage('发表失败，请稍后重试', 'error');
        }
    } finally {
        submitting.value = false;
    }
};

onMounted(() => {
    if (!isAuthenticated()) {
        router.push('/login');
    }
});
</script>
