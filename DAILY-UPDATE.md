# AI Tools Hub — 每日更新清单

> 插件和 Skill 源不限，全渠道爬取，人工精筛后入库。

## 📡 插件/Skill 全渠道源

| 来源 | 抓取方式 | 更新频率 |
|------|---------|---------|
| Product Hunt AI 分类 | web_fetch / RSS | 每日 |
| Hacker News (show_hn) | web_fetch | 每日 |
| GitHub Trending AI | GitHub API | 每日 |
| GitHub Explore Agents | GitHub API | 每日 |
| Reddit r/artificial / r/LocalLLaMA / r/OpenAI | web_fetch | 每日 |
| X/Twitter AI 工具推荐 | web_search | 每周 |
| Discord AI 社区 | 手动整理 | 每周 |
| AI 博客 / 资讯站 RSS | web_fetch | 每日 |
| Claude Code / OpenClaw 插件市场 | web_fetch | 每周 |
| 自研 Skill 动态 | 手动 | 随时 |

## 📋 每日任务

### 1. 全渠道扫描新工具
- [ ] **Product Hunt** — 搜索 "AI" 分类今日新发布，按 upvote 排序
- [ ] **GitHub Trending** — AI 分类今日热门 repo，关注 ⭐ 增长和新增
- [ ] **Hacker News** — Show HN 的 AI 相关新项目
- [ ] **Reddit AI 子版块** — 新鲜推荐帖
- [ ] **AI 资讯站** — TheDecoder / Synced / MarkTechPost 等今日 AI 新工具新闻

### 2. Agent 插件板块专项
- [ ] 将新发现的 Agent 框架/插件写入候选列表
- [ ] 检查现有 10 个卡片是否需要更新（描述/链接/价格变化）
- [ ] 新增 1-3 个工具 → `data-section="agent"`
- [ ] Featured 区轮换（Agent 分类保持新鲜感）

### 3. Skill 专区专项
- [ ] 自研 Skill 状态检查（Ebook Finder / Movie Finder / Music Finder）
- [ ] GitHub Trending 搜 "mcp-server" / "skill" / "agent-skill" 等关键词
- [ ] 新开源 Skill 入库 → `data-section="skill"`
- [ ] SKILL.md 质量检查（有实际功能 > 空壳）

### 4. 全站维护
- [ ] 工具卡片文案润色（用 humanizer 技能）
- [ ] 外链失效检测（每月一次）
- [ ] Featured 区本周热门轮换
- [ ] 更新 CHANGELOG.md

## 🔄 执行方式

### GitHub Actions (自动)
- `.github/workflows/daily-update.yml` 每天 UTC 08:00 自动运行
- 自动推送 GitHub Pages 部署

### Heartbeat 本地触发（心跳时检查）
每次心跳自动执行：
```markdown
- [ ] 扫描 AI 工具热点（Product Hunt / GitHub Trending / Hacker News）
- [ ] 发现新 Agent / Skill → 人工精筛后入库
- [ ] 检查 DAILY-UPDATE.md 待办
```

## 📊 当前数据快照

| 分类 | 数量 | 最后更新 |
|------|------|---------|
| 💬 AI 聊天 | 11 | 2026-05-20 |
| ✍️ AI 写作 | 8 | 2026-05-20 |
| 🎨 AI 画图 | 10 | 2026-05-20 |
| 💻 AI 编程 | 9 | 2026-05-20 |
| 🎬 AI 视频 | 11 | 2026-06-12 ✨ |
| 🎵 AI 音频 | 6 | 2026-05-20 |
| 📊 AI 数据 | 6 | 2026-05-20 |
| 📁 AI 办公 | 11 | 2026-05-20 |
| 🔍 AI 搜索 | 6 | 2026-05-20 |
| 🧩 Agent 插件 | 10 | 2026-06-11 ✨ |
| 🧠 Skill 专区 | 2+ | 2026-05-20 |
| **合计** | **90** | |

## 📁 文件结构

```
ai-tools-hub/
├── index.html              # 主站（自动生成）
├── tools.json              # 工具数据源（核心）
├── CHANGELOG.md            # 更新日志
├── DAILY-UPDATE.md         # 本文件
├── AFFILIATE-PLAN.md       # 联盟计划
├── screenshot.png          # 站点截图
├── README.md               # GitHub 说明
├── LICENSE                 # MIT
├── NEW-TOOLS-CANDIDATES.md # 新增工具候选列表（每日写入）
├── scripts/
│   ├── generate-index.js   # 生成 index.html
│   └── fetch-new-tools.js  # 抓取新工具
└── .github/
    └── workflows/
        └── daily-update.yml # GitHub Actions 自动更新
```

## 🎯 本周目标 (2026-06-11 ~ 06-17)

- [x] 新增 Agent 插件板块（10 个精选工具）
- [ ] 扩充 Skill 专区至 5+（新增 Music Finder / Claude Code 插件等）
- [ ] Agent 板块扩充至 15 个（新增 AutoGPT / Semantic Kernel / ReAct 等）
- [ ] 完善 SEO（sitemap.xml + meta tags + Open Graph）
- [ ] 搭建 NEW-TOOLS-CANDIDATES.md 候选评审流程
