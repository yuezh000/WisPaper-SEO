# WisPaper SEO - 学术论文搜索引擎优化平台

一个基于 Next.js 的学术论文内容管理系统，专注于 SEO 优化和静态页面生成，为学术论文、会议、期刊提供高效的搜索引擎收录解决方案。

## 🏗️ 系统架构

```
              +-----------------------------+
              |     Crawler System          |
              | (API First, Resilient Craw) |
              +-------------+---------------+
                            |
                            v
              +-----------------------------+
              |       Task Queue            |
              |          (Celery)           |
              +-------------+---------------+
                            |
                            v
              +-----------------------------+
              |        CMS Backend          |
              | (PostgreSQL + Next.js Admin)|
              +-------------+---------------+
                            |
                            v
              +-----------------------------+
              |  Static Page Generation     |
              |      (Next.js ISR/SSG)      |
              +-------------+---------------+
                            |
                            v
              +-----------------------------+
              |   CDN / OSS Distribution    |
              +-------------+---------------+
                            |
                            v
              +-----------------------------+
              |   Google Indexing (SEO)     |
              +-----------------------------+
```

## 🛠️ 技术栈

- **前端与页面生成**: Next.js 15.5.3 (ISR/SSG)
- **数据库**: PostgreSQL + Prisma ORM
- **存储与分发**: OSS + CDN（静态文件与图表）
- **任务队列**: Celery（调度爬虫、AI摘要、PDF解析）
- **管理后台**: Next.js Admin / Strapi
- **AI处理**: DocAI + LLM 摘要生成
- **样式系统**: Tailwind CSS 4.0
- **开发工具**: TypeScript, ESLint

## 📋 功能模块设计

### 1. 爬虫系统
**数据源**:
- 会议/期刊：DBLP、WikiCFP、会议官网
- 论文速递：arXiv、IEEE、ACM Digital Library (RSS/API 优先)
- 作者/学校：Crossref、ORCID
- 新闻/FAQ：社群数据、定制采集

**技术方案**:
- API 优先，减少被封风险
- HTML 爬虫需支持代理池、限速
- 数据清洗：正则 + AI 标准化（作者名、机构名、关键词）

### 2. 任务队列（Celery）
**职责**: 解耦高并发任务，异步处理

**调度对象**:
- 爬虫采集任务
- PDF解析任务
- AI摘要生成任务

**特性**:
- 支持任务重试/失败记录
- 支持优先级（紧急会议 > 日常论文速递 > 归档）

### 3. CMS Backend
**核心对象**:
- 论文、会议、期刊、作者、学校、文摘

**功能**:
- 列表、标签、元信息管理
- 内容审核与人工干预接口
- 任务状态追踪（已爬取、解析中、已生成、已发布）

**技术实现**:
- PostgreSQL + Prisma ORM
- Next.js Admin 面板（或 Strapi 作为 Headless CMS）

### 4. 页面静态化
**Next.js ISR（增量静态渲染）**:
- 保证页面按需生成，避免一次性生成百万级文件

**批量预渲染**:
- 分阶段生成页面，每批 1万-5万

**Sitemap 管理**:
- 分区 sitemap（如 conference-sitemap.xml、author-sitemap.xml）
- 每个 sitemap 不超过 5万 URL，按内容类型划分

### 5. 分发与收录
**CDN/OSS**:
- 静态页面与图表统一存放在 OSS
- 全球 CDN 节点加速访问

**Google Search Console**:
- 分批提交 sitemap
- 监控收录率与流量表现

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- PostgreSQL 数据库
- Python 3.8+ (用于 Celery 任务队列)

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env.local` 文件：
```bash
# 数据库配置
DATABASE_URL="postgresql://username:password@localhost:5432/wispaper_seo"

# 其他环境变量
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 数据库初始化
```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库 schema
npx prisma db push

# 查看数据库（可选）
npx prisma studio
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理后台
│   ├── api/               # API 路由
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 首页
├── components/            # React 组件
│   └── ui/               # UI 组件库
├── lib/                  # 工具函数和配置
├── hooks/                # 自定义 React Hooks
├── types/                # TypeScript 类型定义
└── utils/                # 通用工具函数

prisma/
└── schema.prisma         # 数据库模型定义
```

## 🔧 开发命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 数据库相关
npx prisma generate    # 生成 Prisma 客户端
npx prisma db push     # 推送 schema 到数据库
npx prisma studio      # 打开数据库管理界面
```

## 📈 性能优化

- **静态生成**: 使用 Next.js ISR 实现增量静态渲染
- **图片优化**: 自动 WebP 转换和响应式图片
- **代码分割**: 自动按页面和组件分割代码
- **CDN 分发**: 静态资源通过 CDN 全球加速

## 🔍 SEO 优化

- **结构化数据**: 实现 Schema.org 标记
- **Sitemap 管理**: 自动生成和更新 sitemap
- **元数据优化**: 动态生成页面标题和描述
- **页面速度**: 优化 Core Web Vitals 指标

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至项目维护者

---

*基于 Next.js 15.5.3 构建，专注于学术内容的 SEO 优化和搜索引擎收录。*