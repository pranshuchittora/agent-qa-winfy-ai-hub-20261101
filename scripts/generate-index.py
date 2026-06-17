#!/usr/bin/env python3
"""
AI Tools Hub — generate_index.py
从 data/tools.json 读取工具数据，生成 index.html
用法: python generate_index.py [--dry-run]
"""
import json, os, sys, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS_JSON = os.path.join(ROOT, 'data', 'tools.json')
INDEX_HTML = os.path.join(ROOT, 'index.html')

dry_run = '--dry-run' in sys.argv

with open(TOOLS_JSON, 'r', encoding='utf-8') as f:
    data = json.load(f)

categories = data['categories']
featured = data['featured']
tools = data['tools']

def esc(s):
    return str(s).replace('&','&amp;').replace('<','&lt;').replace('>','&gt;').replace('"','&quot;')

def card(t, cat):
    tags_html = []
    for tag in (t.get('tags') or []):
        cls = 'tag'
        if '热门' in tag or tag == 'HOT': cls += ' tag-hot'
        elif '开源' in tag: cls += ' tag-free'
        elif '免费' in tag: cls += ' tag-free'
        elif 'Freemium' in tag: cls += ' tag-freemium'
        elif '付费' in tag: cls += ' tag-paid'
        elif '新上' in tag or t.get('new'): cls += ' tag-new'
        tags_html.append(f'<span class="{cls}">{esc(tag)}</span>')
    tags_str = ''.join(tags_html)

    new_banner = ' <span class="new-banner">NEW</span>' if t.get('new') else ''
    price = t.get('pricing', '—')
    pc = 'free' if '完全免费' in price else ('freemium' if '免费' in price else 'paid')

    return f'''
      <div class="tool-card" data-cat="{cat}" data-name="{esc(t.get("name","").lower().replace(" ","-"))}">
        <div class="card-top">
          <div class="tool-icon" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe)">{t.get("icon","🔧")}</div>
          <div class="card-info">
            <div class="tool-name">{esc(t["name"])}{new_banner}</div>
            <div class="tool-tagline">{esc(t.get("tagline",""))}</div>
          </div>
        </div>
        <div class="card-tags">{tags_str}</div>
        <div class="card-footer">
          <span class="pricing {pc}">{esc(price)}</span>
          <a href="{esc(t.get("link","#"))}" target="_blank" class="visit-btn">立即使用 →</a>
        </div>
      </div>'''

def section(cat):
    cards = '\n'.join(card(t, cat['id']) for t in (tools.get(cat['id']) or []))
    return f'''
  <section class="section" data-section="{cat['id']}">
    <div class="section-title">{cat['icon']} {cat['name']}</div>
    <p class="section-desc">{cat['desc']}</p>
    <div class="tool-grid">{cards}
    </div>
  </section>'''

def featured_html():
    return '\n'.join(f'''
      <div class="featured-card" data-cat="{f['cat']}">
        <div class="featured-rank">{f['rank']}</div>
        <div class="featured-name">{esc(f['name'])}</div>
        <div class="featured-desc">{esc(f['desc'])}</div>
        <span class="featured-link">→ {f['link']}</span>
      </div>''' for f in featured)

def nav_html():
    return '\n'.join(f'<button class="cat-btn" data-cat="{c["id"]}">{c["icon"]} {c["name"]}</button>' for c in categories)

total = sum(len(v) for v in tools.values())

html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Tools Hub — 发现最好的 AI 工具</title>
  <meta name="description" content="精选 {total}+ AI 工具，{len(categories)} 大分类，涵盖 Agent 插件与 Skill 专区。每日更新。" />
  <meta name="robots" content="index,follow" />
  <link rel="manifest" href="manifest.json" />
  <meta name="theme-color" content="#0f0f1a" />
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🤖</text></svg>" />
  <style>
    *,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
    :root{{--bg:#0f0f1a;--card:#1a1a2e;--card2:#16162a;--accent:#6c5ce7;--accent2:#a29bfe;--green:#00cec9;--orange:#fd79a8;--yellow:#ffeaa7;--text:#e8e8f0;--muted:#8888a8;--border:#2a2a45;--radius:14px;--shadow:0 4px 24px rgba(0,0,0,.4);--transition:.25s cubic-bezier(.4,0,.2,1)}}
    html{{scroll-behavior:smooth}}body{{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif;line-height:1.6;min-height:100vh}}a{{color:inherit;text-decoration:none}}ul{{list-style:none}}
    header{{position:sticky;top:0;z-index:100;background:rgba(15,15,26,.85);backdrop-filter:blur(18px);border-bottom:1px solid var(--border);padding:0 24px}}
    .header-inner{{max-width:1280px;margin:0 auto;display:flex;align-items:center;gap:20px;height:64px}}
    .logo{{font-size:1.35rem;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--green));-webkit-background-clip:text;-webkit-text-fill-color:transparent;white-space:nowrap}}
    .header-right{{margin-left:auto;display:flex;gap:12px;align-items:center}}
    .cat-nav{{max-width:1280px;margin:0 auto;padding:16px 24px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid var(--border);position:sticky;top:64px;z-index:99;background:rgba(15,15,26,.92);backdrop-filter:blur(12px)}}
    .cat-btn{{padding:6px 16px;border-radius:50px;border:1px solid var(--border);background:transparent;color:var(--muted);cursor:pointer;font-size:.85rem;transition:all .2s}}
    .cat-btn:hover,.cat-btn.active{{border-color:var(--accent);color:var(--text);background:rgba(108,92,231,.15)}}
    main{{max-width:1280px;margin:0 auto;padding:32px 24px 80px}}
    .section{{margin-bottom:64px}}
    .section-title{{font-size:1.5rem;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:10px}}
    .section-desc{{color:var(--muted);font-size:.95rem;margin-bottom:24px}}
    .tool-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px}}
    .tool-card{{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;transition:transform var(--transition),box-shadow var(--transition)}}
    .tool-card:hover{{transform:translateY(-3px);box-shadow:var(--shadow);border-color:rgba(108,92,231,.3)}}
    .card-top{{display:flex;gap:14px;margin-bottom:12px}}
    .tool-icon{{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}}
    .tool-info{{flex:1;min-width:0}}
    .tool-name{{font-size:1rem;font-weight:700;margin-bottom:4px}}
    .tool-tagline{{font-size:.82rem;color:var(--muted);line-height:1.5}}
    .card-tags{{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}}
    .tag{{font-size:.72rem;padding:2px 8px;border-radius:4px;background:rgba(108,92,231,.1);color:var(--accent2)}}
    .tag-hot{{background:rgba(253,121,168,.12);color:var(--orange)}}
    .tag-free{{background:rgba(0,206,201,.12);color:var(--green)}}
    .tag-new{{background:rgba(255,234,167,.12);color:var(--yellow)}}
    .tag-freemium{{background:rgba(108,92,231,.1);color:var(--accent2)}}
    .tag-paid{{background:rgba(200,200,200,.1);color:#ccc}}
    .card-footer{{display:flex;align-items:center;justify-content:space-between;gap:12px}}
    .pricing{{font-size:.78rem;font-weight:600;padding:3px 10px;border-radius:6px}}
    .pricing.free{{background:rgba(0,206,201,.1);color:var(--green)}}
    .pricing.freemium{{background:rgba(108,92,231,.1);color:var(--accent2)}}
    .pricing.paid{{background:rgba(200,200,200,.1);color:#ccc}}
    .visit-btn{{font-size:.82rem;color:var(--accent2);font-weight:600}}
    .visit-btn:hover{{color:var(--green)}}
    .new-banner{{font-size:.65rem;background:linear-gradient(135deg,var(--orange),#e84393);color:#fff;padding:1px 7px;border-radius:4px;margin-left:6px;vertical-align:middle}}
    .featured-grid{{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;margin-bottom:48px}}
    .featured-card{{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:24px;transition:transform var(--transition);cursor:pointer}}
    .featured-card:hover{{transform:translateY(-3px)}}
    .featured-rank{{font-size:.75rem;color:var(--accent2);margin-bottom:8px}}
    .featured-name{{font-size:1.1rem;font-weight:700;margin-bottom:6px}}
    .featured-desc{{font-size:.82rem;color:var(--muted);line-height:1.6;margin-bottom:12px}}
    .featured-link{{font-size:.78rem;color:var(--green)}}
    footer{{text-align:center;padding:40px 24px;border-top:1px solid var(--border);color:var(--muted);font-size:.85rem}}
    @media(max-width:640px){{.tool-grid{{grid-template-columns:1fr}}.featured-grid{{grid-template-columns:1fr 1fr}}}}
  </style>
</head>
<body>
<header>
  <div class="header-inner">
    <div class="logo">🤖 AI Tools Hub</div>
    <div class="header-right">
      <a href="https://github.com/winfy-88/ai-tools-hub" target="_blank" style="font-size:.85rem;color:var(--muted)">GitHub</a>
    </div>
  </div>
</header>
<nav class="cat-nav" id="catNav">
  <button class="cat-btn active" data-cat="all">🔥 全部</button>
{nav_html()}
</nav>
<main>
  <div class="featured-grid">
{featured_html()}
  </div>
{''.join(section(c) for c in categories)}
</main>
<footer>
  <p>🤖 <strong>AI Tools Hub</strong> — 每天帮你发现最好的 AI 工具</p>
  <p style="margin-top:8px"><a href="#">提交新工具</a> · <a href="https://github.com/winfy-88/ai-tools-hub">GitHub</a></p>
  <p style="margin-top:8px;opacity:.5">© 2025 AI Tools Hub. Made with 💜 by AI.</p>
</footer>
<script>
  const $$ = s => document.querySelectorAll(s);
  $$('.cat-btn').forEach(b => b.addEventListener('click', function() {{
    $$('.cat-btn').forEach(x => x.classList.remove('active'));
    this.classList.add('active');
    const cat = this.dataset.cat;
    $$('.section[data-section]').forEach(s => {{
      const cards = s.querySelectorAll('.tool-card');
      let visible = false;
      cards.forEach(c => {{ const show = cat === 'all' || c.dataset.cat === cat; c.style.display = show ? '' : 'none'; if (show) visible = true; }});
      s.style.display = visible ? '' : 'none';
    }});
    $$('.featured-card').forEach(c => c.style.display = (cat === 'all' || c.dataset.cat === cat) ? '' : 'none');
  }}));
</script>
</body>
</html>'''

if dry_run:
    existing = open(INDEX_HTML, 'r', encoding='utf-8').read() if os.path.exists(INDEX_HTML) else ''
    if existing == html:
        print('No changes')
    else:
        print(f'Changes detected — {len(categories)} cats, {total} tools')
else:
    with open(INDEX_HTML, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f'Generated: {len(categories)} categories, {total} tools')
