#!/usr/bin/env node
/**
 * AI Tools Hub 鈥?generate-index.js
 * 
 * 浠?data/tools.json 璇诲彇宸ュ叿鏁版嵁锛岀敓鎴?index.html
 * 
 * 鐢ㄦ硶: node generate-index.js [--dry-run]
 *   --dry-run  鍙緭鍑?diff锛屼笉鍐欐枃浠? * 
 * 妯″紡 A (default): 浠?data/tools.json 鐢熸垚瀹屾暣 index.html锛堣鐩栧啓鍏ワ級
 * 妯″紡 B (template): 鍙敓鎴?section 鍧楋紝鏇挎崲妯℃澘涓殑 <!-- SECTION_BLOCKS --> 鍗犱綅
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TOOLS_JSON = path.join(ROOT, 'data', 'tools.json');
const INDEX_HTML = path.join(ROOT, 'index.html');
const TEMPLATE_HTML = path.join(ROOT, 'templates', 'index-template.html');

const dryRun = process.argv.includes('--dry-run');

// 鈹€鈹€鈹€ Load tools.json 鈹€鈹€鈹€
let data;
try {
  data = JSON.parse(fs.readFileSync(TOOLS_JSON, 'utf-8'));
} catch (e) {
  console.error('Cannot read data/tools.json:', e.message);
  process.exit(1);
}

const { categories, featured, tools } = data;

// 鈹€鈹€鈹€ Card HTML generator 鈹€鈹€鈹€
function card(t, cat) {
  const tags = (t.tags || []).map(tag => {
    if (tag.includes('鐑棬') || tag === 'HOT') return '<span class="tag tag-hot">鐑棬</span>';
    if (tag.includes('寮€婧?)) return '<span class="tag tag-free">寮€婧?/span>';
    if (tag.includes('鍏嶈垂') || tag === '鍏嶈垂') return '<span class="tag tag-free">鍏嶈垂</span>';
    if (tag.includes('Freemium')) return '<span class="tag tag-freemium">Freemium</span>';
    if (tag.includes('浠樿垂') || tag === '浠樿垂') return '<span class="tag tag-paid">浠樿垂</span>';
    if (tag.includes('鏂颁笂') || tag === '鏂颁笂' || t.new) return '<span class="tag tag-new">鏂颁笂</span>';
    return `<span class="tag">${escHtml(tag)}</span>`;
  }).join('');

  const newBanner = t.new ? ' <span class="new-banner">NEW</span>' : '';
  const pricingClass = t.pricing === '瀹屽叏鍏嶈垂' ? 'free' : t.pricing === '鍏嶈垂鐗堝彲鐢? ? 'freemium' : 'paid';

  return `
      <div class="tool-card" data-cat="${cat}" data-name="${escAttr(t.name.toLowerCase().replace(/\s+/g,'-'))}">
        <div class="card-top">
          <div class="tool-icon" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe)">${t.icon || '馃敡'}</div>
          <div class="card-info">
            <div class="tool-name">${escHtml(t.name)}${newBanner}</div>
            <div class="tool-tagline">${escHtml(t.tagline)}</div>
          </div>
        </div>
        <div class="card-tags">${tags}</div>
        <div class="card-footer">
          <span class="pricing ${pricingClass}">${escHtml(t.pricing || '鈥?)}</span>
          <a href="${escAttr(t.link)}" target="_blank" class="visit-btn">绔嬪嵆浣跨敤 鈫?/a>
        </div>
      </div>`;
}

function sectionBlock(cat) {
  const toolsList = tools[cat.id] || [];
  const cards = toolsList.map(t => card(t, cat.id)).join('\n');
  return `
  <section class="section" data-section="${cat.id}">
    <div class="section-title">${cat.icon} ${cat.name}</div>
    <p class="section-desc">${cat.desc}</p>
    <div class="tool-grid">${cards}
    </div>
  </section>`;
}

function featuredBlock() {
  return featured.map(f => `
      <div class="featured-card" data-cat="${f.cat}">
        <div class="featured-rank">${f.rank}</div>
        <div class="featured-name">${f.name}</div>
        <div class="featured-desc">${f.desc}</div>
        <span class="featured-link">鈫?${f.link}</span>
      </div>`).join('\n');
}

function navButtons() {
  return categories.map(c => 
    `<button class="cat-btn" data-cat="${c.id}">${c.icon} ${c.name}</button>`
  ).join('\n');
}

// 鈹€鈹€鈹€ Build HTML 鈹€鈹€鈹€
function buildHtml() {
  const sections = categories.map(sectionBlock).join('\n');
  const featuredCards = featuredBlock();
  const nav = navButtons();

  // Count stats
  const totalTools = Object.values(tools).reduce((sum, arr) => sum + arr.length, 0);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Tools Hub 鈥?鍙戠幇鏈€濂界殑 AI 宸ュ叿</title>
  <meta name="description" content="绮鹃€?${totalTools}+ AI 宸ュ叿锛?{categories.length} 澶у垎绫伙紝娑电洊 Agent 鎻掍欢涓?Skill 涓撳尯銆傛瘡鏃ユ洿鏂般€? />
  <meta name="robots" content="index,follow" />
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#0f0f1a" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>馃</text></svg>" />
  <style>
    /* 鈹€鈹€ Reset & Base 鈹€鈹€ */
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--bg:#0f0f1a;--card:#1a1a2e;--card2:#16162a;--accent:#6c5ce7;--accent2:#a29bfe;--green:#00cec9;--orange:#fd79a8;--yellow:#ffeaa7;--text:#e8e8f0;--muted:#8888a8;--border:#2a2a45;--radius:14px;--shadow:0 4px 24px rgba(0,0,0,.4);--transition:.25s cubic-bezier(.4,0,.2,1)}
    html{scroll-behavior:smooth}body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;line-height:1.6;min-height:100vh}a{color:inherit;text-decoration:none}ul{list-style:none}
    /* 鈹€鈹€ Header 鈹€鈹€ */
    header{position:sticky;top:0;z-index:100;background:rgba(15,15,26,.85);backdrop-filter:blur(18px);border-bottom:1px solid var(--border);padding:0 24px}
    .header-inner{max-width:1280px;margin:0 auto;display:flex;align-items:center;gap:20px;height:64px}
    .logo{font-size:1.35rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap}
    .header-right{margin-left:auto;display:flex;gap:12px;align-items:center}
    /* 鈹€鈹€ Category Nav 鈹€鈹€ */
    .cat-nav{max-width:1280px;margin:0 auto;padding:16px 24px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border);position:sticky;top:64px;z-index:99;background:rgba(15,15,26,.92);backdrop-filter:blur(12px)}
    .cat-btn{padding:6px 16px;border-radius:50px;border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;font-size:.85rem;transition:all .2s}
    .cat-btn:hover,.cat-btn.active{border-color:var(--accent);color:var(--text);background:rgba(108,92,231,.15)}
    /* 鈹€鈹€ Main 鈹€鈹€ */
    main{max-width:1280px;margin:0 auto;padding:32px 24px 80px}
    .section{margin-bottom:64px}
    .section-title{font-size:1.5rem;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:10px}
    .section-desc{color:var(--muted);font-size:.95rem;margin-bottom:24px}
    /* 鈹€鈹€ Tool Grid 鈹€鈹€ */
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
    /* 鈹€鈹€ Featured 鈹€鈹€ */
    .featured-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:48px}
    .featured-card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;transition:transform var(--transition);cursor:pointer}
    .featured-card:hover{transform:translateY(-3px)}
    .featured-rank{font-size:.75rem;color:var(--accent2);margin-bottom:8px}
    .featured-name{font-size:1.1rem;font-weight:700;margin-bottom:6px}
    .featured-desc{font-size:.82rem;color:var(--muted);line-height:1.6;margin-bottom:12px}
    .featured-link{font-size:.78rem;color:var(--green)}
    /* 鈹€鈹€ Footer 鈹€鈹€ */
    footer{text-align:center;padding:40px 24px;border-top:1px solid var(--border);color:var(--muted);font-size:.85rem}
    /* 鈹€鈹€ Responsive 鈹€鈹€ */
    @media(max-width:640px){.tool-grid{grid-template-columns:1fr}.featured-grid{grid-template-columns:1fr 1fr}}
  </style>
</head>
<body>
<header>
  <div class="header-inner">
    <div class="logo">馃 AI Tools Hub</div>
    <div class="header-right">
      <a href="https://github.com/winfy-88/ai-tools-hub" target="_blank" style="font-size:.85rem;color:var(--muted)">GitHub</a>
      <a href="#"><span data-translate="submit">鎻愪氦鏂板伐鍏?/span></a>
    </div>
  </div>
</header>

<!-- Category Nav -->
<nav class="cat-nav" id="catNav">
  <button class="cat-btn active" data-cat="all">馃敟 鍏ㄩ儴</button>
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
  <p>馃 <strong>AI Tools Hub</strong> 鈥?姣忓ぉ甯綘鍙戠幇鏈€濂界殑 AI 宸ュ叿</p>
  <p style="margin-top:8px"><a href="#">鎻愪氦鏂板伐鍏?/a> 路 <a href="#">RSS 璁㈤槄</a> 路 <a href="#">鍏充簬鎴戜滑</a></p>
  <p style="margin-top:8px;opacity:.5">漏 2025 AI Tools Hub. Made with 馃挏 by AI.</p>
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
        cards.forEach(c => { const show = cat === 'all' || c.dataset.cat === cat; c.style.display = show ? '' : 'none'; if (show) visible = true; });
        s.style.display = visible ? '' : 'none';
      });
      $$('.featured-card').forEach(c => c.style.display = (cat === 'all' || c.dataset.cat === cat) ? '' : 'none');
    }));
  }
  document.addEventListener('DOMContentLoaded', initCategoryFilter);
</script>
</body>
</html>`;
}

// 鈹€鈹€鈹€ Helpers 鈹€鈹€鈹€
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function escAttr(s) {
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// 鈹€鈹€鈹€ Main 鈹€鈹€鈹€
const html = buildHtml();
const outPath = path.join(ROOT, 'index.html');
const totalTools = Object.values(tools).reduce((s,a)=>s+a.length,0); const totalTools = Object.values(tools).reduce((s,a)=>s+a.length,0); const stats = { totalCategories: categories.length, totalTools };

if (dryRun) {
  const existing = fs.readFileSync(outPath, 'utf-8');
  if (existing === html) {
    console.log('鉁?No changes 鈥?index.html is up to date');
  } else {
    console.log('馃摑 Changes detected 鈥?would write index.html');
    console.log(`   Categories: ${categories.length}, Tools: ${Object.values(tools).reduce((s,a)=>s+a.length,0)}`);
  }
} else {
  fs.writeFileSync(outPath, html, 'utf-8');
  console.log(`鉁?index.html generated: ${categories.length} categories, ${Object.values(tools).reduce((s,a)=>s+a.length,0)} tools`);
}


