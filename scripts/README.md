# AI Tools Hub — 每日自动更新脚本

## 设计思路（方案 B：完整版）

```
每日自动搜索 → 发现新工具 → 写入候选列表 → 人工精筛 → 入库
```

### 数据流

```
GitHub Trending / Product Hunt / Hacker News / Reddit
         ↓
  fetch-new-tools.js (自动抓取，输出 JSON)
         ↓
  NEW-TOOLS-CANDIDATES.md (人工精筛)
         ↓
  generate-index.js (生成 index.html)
         ↓
  AI Tools Hub 上线
```

### 搜索源（自动化可获取）

| 来源 | 方式 | 频率 |
|------|------|------|
| GitHub Trending AI | GitHub REST API | 每小时 |
| GitHub Explore Agents | GitHub Search API | 每小时 |
| Product Hunt | RSS / API | 每日 |
| Hacker News Show HN | Algolia API | 每小时 |
| Reddit r/artificial | JSON API | 每日 |

### 搜索源（需人工/心跳补充）

| 来源 | 方式 | 频率 |
|------|------|------|
| X/Twitter AI 推荐 | web_search | 每日 |
| AI 博客资讯 | web_fetch / RSS | 每日 |
| ClawHub 新 Skill | ClawHub API | 每周 |

### 文件结构

```
ai-tools-hub/
├── index.html              # 主站（generate-index.js 生成）
├── tools.json              # 工具数据源（结构化的工具库）
├── DAILY-UPDATE.md         # 更新日志+状态追踪
├── AFFILIATE-PLAN.md       # 联盟计划
├── NEW-TOOLS-CANDIDATES.md # 候选列表（脚本写入+人工标注）
├── CHANGELOG.md            # 版本日志
├── screenshot.png          # 站点截图
├── README.md               # GitHub 说明
├── LICENSE                 # MIT
├── scripts/
│   ├── fetch-new-tools.js  # 抓取新工具（GitHub Trending, HN, Reddit...）
│   ├── generate-index.js   # 从 tools.json 生成 index.html
│   └── package.json        # Node.js 配置
├── data/
│   ├── tools.json          # 完整工具数据
│   └── categories.json     # 分类配置
└── .github/
    └── workflows/
        └── daily-update.yml # GitHub Actions 自动更新
```

### 执行频率

- **每小时**：fetch-new-tools.js 跑 GitHub Trending + HN + Reddit
- **每日 UTC 08:00**：GitHub Actions 跑完整流程（fetch → generate → push）
- **每次心跳**：OpenClaw Heartbeat 跑一次轻量搜索，发现好东西写入候选

### 网络说明

- GitHub push 需要 AHA 加速器或代理
- fetch-new-tools.js 只读 API，不需要代理
- push 失败时脚本会记录到 DAILY-UPDATE.md，等网络恢复再补推
