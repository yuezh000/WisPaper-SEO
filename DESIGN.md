# WisPaper SEO 系统设计文档

## 📋 目录
- [系统概述](#系统概述)
- [数据库设计](#数据库设计)
- [API接口设计](#api接口设计)
- [数据流设计](#数据流设计)
- [技术实现细节](#技术实现细节)

## 🎯 系统概述

WisPaper SEO 是一个专注于学术论文搜索引擎优化的内容管理系统，通过爬虫采集、AI处理、静态生成和CDN分发，为学术内容提供高效的搜索引擎收录解决方案。

### 核心目标
- 高效采集学术论文、会议、期刊数据
- 通过AI处理提升内容质量和SEO效果
- 生成大量静态页面并优化搜索引擎收录
- 提供完整的内容管理和监控体系

## 🗄️ 数据库设计

### 核心实体关系图

```
Authors (作者)
    ↓ (1:N)
Papers (论文) ← (N:M) → Conferences (会议)
    ↓ (1:N)              ↓ (1:N)
Abstracts (摘要)        Venues (会议地点)
    ↓ (1:N)
Keywords (关键词)

Institutions (机构)
    ↓ (1:N)
Authors (作者)

Tasks (任务)
    ↓ (1:N)
TaskLogs (任务日志)
```

### 数据模型详细设计

#### 1. Authors (作者表)
```sql
- id: UUID (主键)
- name: String (作者姓名)
- email: String? (邮箱)
- orcid: String? (ORCID ID)
- institution_id: UUID (所属机构)
- bio: String? (简介)
- homepage: String? (个人主页)
- created_at: DateTime
- updated_at: DateTime
```

#### 2. Papers (论文表)
```sql
- id: UUID (主键)
- title: String (论文标题)
- abstract: String? (摘要)
- doi: String? (DOI)
- arxiv_id: String? (arXiv ID)
- pdf_url: String? (PDF链接)
- publication_date: DateTime? (发表日期)
- conference_id: UUID? (所属会议)
- venue: String? (发表场所)
- pages: String? (页码)
- volume: String? (卷号)
- issue: String? (期号)
- citation_count: Int (引用次数)
- status: PaperStatus (状态: DRAFT, PUBLISHED, ARCHIVED)
- seo_score: Float? (SEO评分)
- created_at: DateTime
- updated_at: DateTime
```

#### 3. Conferences (会议表)
```sql
- id: UUID (主键)
- name: String (会议名称)
- acronym: String? (会议简称)
- description: String? (会议描述)
- website: String? (官网)
- submission_deadline: DateTime? (投稿截止)
- notification_date: DateTime? (通知日期)
- conference_date: DateTime? (会议日期)
- venue_id: UUID? (会议地点)
- status: ConferenceStatus (状态: UPCOMING, ONGOING, COMPLETED)
- created_at: DateTime
- updated_at: DateTime
```

#### 4. Institutions (机构表)
```sql
- id: UUID (主键)
- name: String (机构名称)
- type: InstitutionType (类型: UNIVERSITY, RESEARCH_INSTITUTE, COMPANY)
- country: String? (国家)
- city: String? (城市)
- website: String? (官网)
- created_at: DateTime
- updated_at: DateTime
```

#### 5. Venues (会议地点表)
```sql
- id: UUID (主键)
- name: String (地点名称)
- city: String (城市)
- country: String (国家)
- address: String? (详细地址)
- latitude: Float? (纬度)
- longitude: Float? (经度)
- created_at: DateTime
- updated_at: DateTime
```

#### 6. Keywords (关键词表)
```sql
- id: UUID (主键)
- name: String (关键词)
- category: String? (分类)
- frequency: Int (使用频率)
- created_at: DateTime
- updated_at: DateTime
```

#### 7. Abstracts (摘要表)
```sql
- id: UUID (主键)
- paper_id: UUID (论文ID)
- content: String (摘要内容)
- language: String (语言)
- source: AbstractSource (来源: ORIGINAL, AI_GENERATED, MANUAL)
- quality_score: Float? (质量评分)
- created_at: DateTime
- updated_at: DateTime
```

#### 8. Tasks (任务表)
```sql
- id: UUID (主键)
- type: TaskType (任务类型: CRAWL, PARSE_PDF, GENERATE_ABSTRACT, INDEX_PAGE)
- status: TaskStatus (状态: PENDING, RUNNING, COMPLETED, FAILED)
- priority: Int (优先级: 1-10)
- payload: Json (任务参数)
- result: Json? (任务结果)
- error_message: String? (错误信息)
- retry_count: Int (重试次数)
- max_retries: Int (最大重试次数)
- scheduled_at: DateTime? (计划执行时间)
- started_at: DateTime? (开始时间)
- completed_at: DateTime? (完成时间)
- created_at: DateTime
- updated_at: DateTime
```

#### 9. TaskLogs (任务日志表)
```sql
- id: UUID (主键)
- task_id: UUID (任务ID)
- level: LogLevel (日志级别: INFO, WARN, ERROR)
- message: String (日志消息)
- metadata: Json? (元数据)
- created_at: DateTime
```

#### 10. PaperAuthors (论文作者关联表)
```sql
- id: UUID (主键)
- paper_id: UUID (论文ID)
- author_id: UUID (作者ID)
- order: Int (作者顺序)
- is_corresponding: Boolean (是否通讯作者)
- created_at: DateTime
```

#### 11. PaperKeywords (论文关键词关联表)
```sql
- id: UUID (主键)
- paper_id: UUID (论文ID)
- keyword_id: UUID (关键词ID)
- relevance_score: Float? (相关性评分)
- created_at: DateTime
```

## 🔌 API接口设计

### RESTful API 设计原则
- 使用标准HTTP方法 (GET, POST, PUT, DELETE)
- 统一的响应格式
- 分页和过滤支持
- 版本控制 (v1)

### 统一响应格式
```json
{
  "success": true,
  "data": {},
  "message": "操作成功",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 核心API接口

#### 1. 论文管理 API

##### GET /api/v1/papers
获取论文列表
```json
Query Parameters:
- page: number (页码)
- limit: number (每页数量)
- search: string (搜索关键词)
- conference_id: string (会议ID)
- author_id: string (作者ID)
- status: string (状态)
- sort: string (排序字段)
- order: "asc" | "desc" (排序方向)

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "论文标题",
      "abstract": "摘要内容",
      "authors": [...],
      "conference": {...},
      "keywords": [...],
      "publication_date": "2024-01-01",
      "citation_count": 10,
      "seo_score": 85.5
    }
  ],
  "pagination": {...}
}
```

##### GET /api/v1/papers/{id}
获取论文详情
```json
Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "论文标题",
    "abstract": "摘要内容",
    "doi": "10.1000/182",
    "pdf_url": "https://...",
    "authors": [...],
    "conference": {...},
    "keywords": [...],
    "abstracts": [...],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

##### POST /api/v1/papers
创建论文
```json
Request Body:
{
  "title": "论文标题",
  "abstract": "摘要内容",
  "doi": "10.1000/182",
  "conference_id": "uuid",
  "author_ids": ["uuid1", "uuid2"],
  "keywords": ["keyword1", "keyword2"]
}
```

##### PUT /api/v1/papers/{id}
更新论文
```json
Request Body:
{
  "title": "更新后的标题",
  "abstract": "更新后的摘要",
  "status": "PUBLISHED"
}
```

##### DELETE /api/v1/papers/{id}
删除论文

#### 2. 会议管理 API

##### GET /api/v1/conferences
获取会议列表
```json
Query Parameters:
- page: number
- limit: number
- search: string
- status: string
- year: number

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "会议名称",
      "acronym": "ICML",
      "description": "会议描述",
      "website": "https://...",
      "submission_deadline": "2024-03-01",
      "conference_date": "2024-07-01",
      "venue": {...},
      "status": "UPCOMING",
      "paper_count": 150
    }
  ]
}
```

##### GET /api/v1/conferences/{id}
获取会议详情

##### POST /api/v1/conferences
创建会议

##### PUT /api/v1/conferences/{id}
更新会议

#### 3. 作者管理 API

##### GET /api/v1/authors
获取作者列表
```json
Query Parameters:
- page: number
- limit: number
- search: string
- institution_id: string

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "作者姓名",
      "email": "author@example.com",
      "orcid": "0000-0000-0000-0000",
      "institution": {...},
      "paper_count": 25,
      "citation_count": 500
    }
  ]
}
```

##### GET /api/v1/authors/{id}
获取作者详情

##### POST /api/v1/authors
创建作者

##### PUT /api/v1/authors/{id}
更新作者

#### 4. 任务管理 API

##### GET /api/v1/tasks
获取任务列表
```json
Query Parameters:
- page: number
- limit: number
- type: string
- status: string
- priority: number

Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "CRAWL",
      "status": "RUNNING",
      "priority": 5,
      "payload": {...},
      "progress": 75,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

##### POST /api/v1/tasks
创建任务
```json
Request Body:
{
  "type": "CRAWL",
  "priority": 5,
  "payload": {
    "url": "https://example.com",
    "source": "arxiv"
  }
}
```

##### GET /api/v1/tasks/{id}
获取任务详情

##### PUT /api/v1/tasks/{id}/status
更新任务状态

#### 5. 统计分析 API

##### GET /api/v1/stats/overview
获取系统概览统计
```json
Response:
{
  "success": true,
  "data": {
    "total_papers": 10000,
    "total_conferences": 500,
    "total_authors": 2000,
    "pending_tasks": 25,
    "failed_tasks": 5,
    "seo_score_avg": 78.5
  }
}
```

##### GET /api/v1/stats/papers/trend
获取论文趋势统计

##### GET /api/v1/stats/conferences/upcoming
获取即将到来的会议

#### 6. 搜索 API

##### GET /api/v1/search
全文搜索
```json
Query Parameters:
- q: string (搜索关键词)
- type: string (搜索类型: papers, authors, conferences)
- page: number
- limit: number

Response:
{
  "success": true,
  "data": {
    "papers": [...],
    "authors": [...],
    "conferences": [...],
    "total": 150
  }
}
```

## 🔄 数据流设计

### 1. 数据采集流程
```
外部数据源 → 爬虫任务 → 数据清洗 → 数据存储 → 任务完成通知
```

### 2. 内容处理流程
```
原始论文 → PDF解析 → AI摘要生成 → 关键词提取 → SEO优化 → 静态页面生成
```

### 3. 搜索引擎优化流程
```
内容更新 → 静态页面重新生成 → Sitemap更新 → CDN缓存刷新 → 搜索引擎通知
```

## 🛠️ 技术实现细节

### 1. 数据库优化
- 使用索引优化查询性能
- 分表分库策略（按年份、类型）
- 读写分离配置
- 连接池管理

### 2. API性能优化
- 响应缓存策略
- 分页查询优化
- 数据库查询优化
- 异步处理支持

### 3. 安全考虑
- API认证和授权
- 输入验证和过滤
- SQL注入防护
- 速率限制

### 4. 监控和日志
- API调用监控
- 数据库性能监控
- 错误日志记录
- 业务指标统计

## 📊 性能指标

### 目标性能指标
- API响应时间: < 200ms (95th percentile)
- 数据库查询时间: < 100ms (95th percentile)
- 并发用户数: 1000+
- 数据存储量: 100万+ 论文记录

### 扩展性考虑
- 水平扩展支持
- 微服务架构准备
- 缓存层设计
- CDN集成方案

---

*本文档将随着系统开发进展持续更新和完善。*
