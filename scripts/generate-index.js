#!/usr/bin/env node
/**
 * AI Tools Hub — generate-index.js
 * Reads data/tools.json, generates index.html
 *
 * Usage: node generate-index.js [--dry-run]
 *   --dry-run  only print diff, do not write file
 *
 * Mode A (default): generate full index.html from tools.json (overwrite)
 * Mode B (template): generate section blocks only, inject into template
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS_JSON = path.join(ROOT, 'data', 'tools.json');
const INDEX_HTML = path.join(ROOT, 'index.html');

const dryRun = process.argv.includes('--dry-run');

// Load tools.json
let data;
try {
  data = JSON.parse(fs.readFileSync(TOOLS_JSON, 'utf-8'));
} catch (e) {
  console.error('Cannot read data/tools.json:', e.message);
  process.exit(1);
}

const { categories, featured, tools } = data;

// --- HTML helpers ---
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Tag labels (use ASCII-safe labels, data is already in Chinese)
const TAG_MAP = {
  hot:      '热门',
  free:     '免费',
  paid:     '付费',
  freemium: 'Freemium',
  new:      '新上线',
};

// --- Card HTML generator ---
function card(t, cat) {
  const tags = (t.tags || []).map(tag => {
    const key = tag.toLowerCase();
    if (key === 'hot') return `<span class="tag tag-hot">${TAG_MAP.hot}</span>`;
    if (key === 'free') return `<span class="tag tag-free">${TAG_MAP.free}</span>`;
    if (key === 'paid') return `<span class="tag tag-paid">${TAG_MAP.paid}</span>`;
    if (key === 'freemium') return `<span class="tag tag-freemium">${TAG_MAP.freemium}</span>`;
    if (key === 'new' || t.new) return `<span class="tag tag-new">${TAG_MAP.new}</span>`;
    return `<span class="tag">${escHtml(tag)}</span>`;
  }).join('');

  const newBanner = t.new ? ' <span class="new-banner">NEW</span>' : '';
  const pricingLabel = t.pricing || '—';
  const pricingClass = t.pricing === '完全免费' ? 'free'
    : (t.pricing || '').includes('免费') ? 'freemium'
    : 'paid';

  return `
      <div class="tool-card" data-cat="${cat}" data-name="${escAttr(t.name.toLowerCase().replace(/\s+/g, '-'))}">
        <div class="card-top">
          <div class="tool-icon" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe)">${t.icon || '🤖'}</div>
          <div class="card-info">
            <div class="tool-name">${escHtml(t.name)}${newBanner}</div>
            <div class="tool-tagline">${escHtml(t.tagline)}</div>
          </div>
        </div>
        <div class="card-tags">${tags}</div>
        <div class="card-footer">
          <span class="pricing ${pricingClass}">${escHtml(pricingLabel)}</span>
          <a href="${escAttr(t.link)}" target="_blank" class="visit-btn">立即使用 →</a>
        </div>
      </div>`;
}

function sectionBlock(cat) {
  const toolsList = tools[cat.id] || [];
  const cards = toolsList.map(t => card(t, cat.id)).join('\n');
  return `
  <section class="section" data-section="${cat.id}">
    <div class="section-title">${cat.icon} ${escHtml(cat.name)}</div>
    <p class="section-desc">${escHtml(cat.desc)}</p>
    <div class="tool-grid">${cards}
    </div>
  </section>`;
}

function featuredBlock() {
  return featured.map(f => `
      <div class="featured-card" data-cat="${f.cat}">
        <div class="featured-rank">${escHtml(f.rank)}</div>
        <div class="featured-name">${escHtml(f.name)}</div>
        <div class="featured-desc">${escHtml(f.desc)}</div>
        <span class="featured-link">→ ${escHtml(f.link)}</span>
      </div>`).join('\n');
}

function navButtons() {
  return categories.map(c =>
    `<button class="cat-btn" data-cat="${c.id}">${c.icon} ${escHtml(c.name)}</button>`
  ).join('');
}

// --- Build full HTML ---
function buildHtml() {
  const sections = categories.map(sectionBlock).join('\n');
  const featuredCards = featuredBlock();
  const nav = navButtons();
  const totalTools = Object.values(tools).reduce((sum, arr) => sum + arr.length, 0);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Tools Hub — 发现最好的 AI 工具</title>
  <meta name="description" content="精选${totalTools}+ AI 工具，${categories.length} 大分类，涵盖 Agent 插件与 Skill 专区。每日更新。" />
  <meta name="robots" content="index,follow" />
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#0f0f1a" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
  <style>
    /* Reset & Base */
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#0f0f1a;--card:#1a1a2e;--card2:#16162a;--accent:#6c5ce7;--accent2:#a29bfe;--green:#00cec9;--orange:#fd79a8;--yellow:#ffeaa7;--text:#e8e8f0;--muted:#8888a8;--border:#2a2a45;--radius:14px;--shadow:0 4px 24px rgba(0,0,0,.4);--transition:.25s cubic-bezier(.4,0,.2,1)}
    html{scroll-behavior:smooth}
    body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;line-height:1.6;min-height:100vh}
    a{color:inherit;text-decoration:none}
    ul{list-style:none}
    /* Header */
    header{position:sticky;top:0;z-index:100;background:rgba(15,15,26,.85);backdrop-filter:blur(18px);border-bottom:1px solid var(--border);padding:0 24px}
    .header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;gap:20px;height:64px}
    .logo{font-size:1.35rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap}
    .header-right{margin-left:auto;display:flex;gap:12px;align-items:center}
    /* Category Nav */
    .cat-nav{max-width:1280px;margin:0 auto;padding:16px 24px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border);position:sticky;top:64px;z-index:99;background:rgba(15,15,26,.92);backdrop-filter:blur(12px)}
    .cat-btn{padding:6px 16px;border-radius:50px;border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;font-size:.85rem;transition:all .2s}
    .cat-btn:hover,.cat-btn.active{border-color:var(--accent);color:var(--text);background:rgba(108,92,231,.15)}
    /* Main */
    main{max-width:1280px;margin:0 auto;padding:32px 24px 80px}
    .section{margin-bottom:64px}
    .section-title{font-size:1.5rem;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:10px}
    .section-desc{color:var(--muted);font-size:.95rem;margin-bottom:24px}
    /* Tool Grid */
    .tool-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}
    .tool-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;transition:transform var(--transition),box-shadow var(--transition);position:relative;overflow:hidden}
    .tool-card:hover{transform:translateY(-3px);box-shadow:var(--shadow);border-color:rgba(108,92,231,.3)}
    .card-top{display:flex;gap:14px;margin-bottom:12px}
    .tool-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}
    .tool-info{flex:1;min-width:0}
    .tool-name{font-size:1rem;font-weight:700;margin-bottom:4px}
    .tool-tagline{font-size:.82rem;color:var(--muted);line-height:1.5}
    .card-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}
    .tag{font-size:.72rem;padding:2px 8px;border-radius:4px;background:rgba(108,92,231,.1);color:var(--accent2)}
    .tag-hot{background:rgba(253,121,168,.12);color:var(--orange)}
    .tag-free{background:rgba(0,206,201,.12);color:var(--green)}
    .tag-new{background:rgba(255,234,167,.12);color:var(--yellow)}
    .tag-freemium{background:rgba(108,92,231,.1);color:var(--accent2)}
    .tag-paid{background:rgba(200,200,200,.1);color:#ccc}
    .card-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .pricing{font-size:.78rem;font-weight:600;padding:3px 10px;border-radius:6px}
    .pricing.free{background:rgba(0,206,201,.1);color:var(--green)}
    .pricing.freemium{background:rgba(108,92,231,.1);color:var(--accent2)}
    .pricing.paid{background:rgba(200,200,200,.1);color:#ccc}
    .visit-btn{font-size:.82rem;color:var(--accent2);font-weight:600;transition:color .2s}
    .visit-btn:hover{color:var(--green)}
    .new-banner{font-size:.65rem;background:linear-gradient(135deg,var(--orange),#e84393);color:#fff;padding:1px 7px;border-radius:4px;margin-left:6px;vertical-align:middle}
    /* Featured */
    .featured-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:48px}
    .featured-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;transition:transform var(--transition);cursor:pointer}
    .featured-card:hover{transform:translateY(-3px)}
    .featured-rank{font-size:.75rem;color:var(--accent2);margin-bottom:8px}
    .featured-name{font-size:1.1rem;font-weight:700;margin-bottom:6px}
    .featured-desc{font-size:.82rem;color:var(--muted);line-height:1.6;margin-bottom:12px}
    .featured-link{font-size:.78rem;color:var(--green)}
    /* Footer */
    footer{text-align:center;padding:40px 24px;border-top:1px solid var(--border);color:var(--muted);font-size:.85rem}
    /* Responsive */
    @media(max-width:640px){.tool-grid{grid-template-columns:1fr}.featured-grid{grid-template-columns:1fr 1fr}}
  </style>
</head>
<body>
<header>
  <div class="header-inner">
    <div class="logo">🤖 AI Tools Hub</div>
    <div class="header-right">
      <a href="https://github.com/winfy-88/ai-tools-hub" target="_blank" style="font-size:.85rem;color:var(--muted)">GitHub</a>
      <a href="#"><span data-translate="submit">提交新工具</span></a>
    </div>
  </div>
</header>

<!-- Category Nav -->
<nav class="cat-nav" id="catNav">
  <button class="cat-btn active" data-cat="all">🔍 全部</button>
${nav}
</nav>

<main>

  <!-- Featured -->
  <div class="featured-grid">
${featuredCards}
  </div>

${sections}

</main>

<footer>
  <p>🤖 <strong>AI Tools Hub</strong> — 每天让你发现最好的 AI 工具</p>
  <p style="margin-top:8px"><a href="#">提交新工具</a> · <a href="#">RSS 订阅</a> · <a href="#">关于我们</a></p>
  <p style="margin-top:8px;opacity:.5">© 2025 AI Tools Hub. Made with 🤖 by AI.</p>
</footer>

<script>
  const $$ = s => document.querySelectorAll(s);
  const $ = s => document.querySelector(s);
  function initCategoryFilter() {
    $$('.cat-btn').forEach(b => b.addEventListener('click', function() {
      $$('.cat-btn').forEach(x => x.classList.remove('active'));
      this.classList.add('active');
      const cat = this.dataset.cat;
      $$('.section[data-section]').forEach(s => {
        const cards = s.querySelectorAll('.tool-card');
        let visible = false;
        cards.forEach(c => {
          const show = cat === 'all' || c.dataset.cat === cat;
          c.style.display = show ? '' : 'none';
          if (show) visible = true;
        });
        s.style.display = visible ? '' : 'none';
      });
      $$('.featured-card').forEach(c => {
        c.style.display = (cat === 'all' || c.dataset.cat === cat) ? '' : 'none';
      });
    }));
  }
  document.addEventListener('DOMContentLoaded', initCategoryFilter);
</script>
</body>
</html>`;
}

// --- Debug ---
const debugHtml = buildHtml();
const navStart = debugHtml.indexOf('<nav class="cat-nav"');
const navEnd = debugHtml.indexOf('</nav>');
if (navStart >= 0 && navEnd >= 0) { fs.writeFileSync('debug-nav-section.txt', debugHtml.substring(navStart, navEnd + 6), 'utf-8'); }
const html = debugHtml;
const outPath = path.join(ROOT, 'index.html');
const totalTools = Object.values(tools).reduce((s, a) => s + a.length, 0);

if (dryRun) {
  const existing = fs.readFileSync(outPath, 'utf-8');
  if (existing === html) {
    console.log('✓ No changes — index.html is up to date');
  } else {
    console.log('⚠ Changes detected — would write index.html');
    console.log(`   Categories: ${categories.length}, Tools: ${totalTools}`);
  }
} else {
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`✓ index.html generated: ${categories.length} categories, ${totalTools} tools`);
}
