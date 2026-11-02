// 从后端拉全部文章，生成 public/sitemap.xml。
//
// 这个文件之前不存在：nginx 的 `try_files $uri /index.html` 把 /sitemap.xml
// 也当成未匹配路径兜底成了首页 HTML，爬虫拿到的是一整份 <!DOCTYPE html>。
// 现在 public/ 会被 Vite 原样拷进 dist/ 根，构建前跑一次就能产出真文件。
//
// 用法：node scripts/gen-sitemap.mjs（已挂在 npm prebuild 上）
import { writeFileSync } from 'node:fs';

const SITE = 'https://blog.coco-29.wang';
const API = 'https://api.coco-29.wang';
const PAGE_SIZE = 50;

// 固定页面，内容不随文章变化，不给 lastmod 让爬虫自己判断
const STATIC_PATHS = ['/', '/articles', '/about'];

const escapeXml = (s) =>
  s.replace(
    /[<>&'"]/g,
    (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c],
  );

async function fetchArticles() {
  const all = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/api/articles?page=${page}&page_size=${PAGE_SIZE}`);
    if (!res.ok) throw new Error(`拉文章列表失败：HTTP ${res.status}`);
    const body = await res.json();
    const list = body?.data?.articles ?? [];
    all.push(...list);
    // 不满一整页说明已经到底，不必再空跑一次
    if (list.length < PAGE_SIZE) break;
  }
  return all;
}

const urlEntry = (loc, lastmod) =>
  `  <url>\n    <loc>${escapeXml(loc)}</loc>\n` +
  (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
  '  </url>';

async function main() {
  // hidden 的文章是草稿或私密内容，不该出现在 sitemap 里
  const articles = (await fetchArticles()).filter((a) => !a.hidden);

  const entries = [
    ...STATIC_PATHS.map((p) => urlEntry(SITE + p)),
    ...articles.map((a) =>
      urlEntry(`${SITE}/articles/${a.id}`, (a.updatedAt || a.createdAt || '').slice(0, 10)),
    ),
  ];

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join('\n') +
    '\n</urlset>\n';

  writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml, 'utf8');
  console.log(`sitemap.xml：${STATIC_PATHS.length} 个固定页 + ${articles.length} 篇文章`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
