# WisPaper SEO API 文档

## 📋 概述

WisPaper SEO API 提供了完整的学术论文内容管理功能，包括论文、会议、作者、机构等核心实体的CRUD操作，以及搜索、统计等高级功能。

## 🔗 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **响应格式**: 统一的JSON格式

### 统一响应格式

```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## 📚 核心API接口

### 1. 论文管理 (Papers)

#### GET /api/v1/papers
获取论文列表

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `search`: 搜索关键词
- `conference_id`: 会议ID
- `author_id`: 作者ID
- `status`: 论文状态 (DRAFT, PUBLISHED, ARCHIVED)
- `keyword`: 关键词
- `sort`: 排序字段
- `order`: 排序方向 (asc, desc)

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "论文标题",
      "abstract": "摘要内容",
      "doi": "10.1000/182",
      "arxiv_id": "2301.12345",
      "authors": [...],
      "conference": {...},
      "keywords": [...],
      "citation_count": 10,
      "seo_score": 85.5
    }
  ],
  "pagination": {...}
}
```

#### GET /api/v1/papers/{id}
获取论文详情

#### POST /api/v1/papers
创建论文

**请求体**:
```json
{
  "title": "论文标题",
  "abstract": "摘要内容",
  "doi": "10.1000/182",
  "conference_id": "uuid",
  "author_ids": ["uuid1", "uuid2"],
  "keywords": ["keyword1", "keyword2"]
}
```

#### PUT /api/v1/papers/{id}
更新论文

#### DELETE /api/v1/papers/{id}
删除论文

### 2. 会议管理 (Conferences)

#### GET /api/v1/conferences
获取会议列表

**查询参数**:
- `page`, `limit`, `search`, `sort`, `order`: 通用分页和搜索参数
- `status`: 会议状态 (UPCOMING, ONGOING, COMPLETED)
- `year`: 年份

#### POST /api/v1/conferences
创建会议

**请求体**:
```json
{
  "name": "会议名称",
  "acronym": "ICML",
  "description": "会议描述",
  "website": "https://example.com",
  "submission_deadline": "2024-03-01",
  "conference_date": "2024-07-01",
  "status": "UPCOMING"
}
```

### 3. 作者管理 (Authors)

#### GET /api/v1/authors
获取作者列表

**查询参数**:
- `page`, `limit`, `search`, `sort`, `order`: 通用分页和搜索参数
- `institution_id`: 机构ID

#### POST /api/v1/authors
创建作者

**请求体**:
```json
{
  "name": "作者姓名",
  "email": "author@example.com",
  "orcid": "0000-0000-0000-0000",
  "institution_id": "uuid",
  "bio": "作者简介"
}
```

### 4. 机构管理 (Institutions)

#### GET /api/v1/institutions
获取机构列表

**查询参数**:
- `page`, `limit`, `search`, `sort`, `order`: 通用分页和搜索参数
- `type`: 机构类型 (UNIVERSITY, RESEARCH_INSTITUTE, COMPANY)
- `country`: 国家

#### POST /api/v1/institutions
创建机构

**请求体**:
```json
{
  "name": "机构名称",
  "type": "UNIVERSITY",
  "country": "China",
  "city": "Beijing",
  "website": "https://example.edu"
}
```

### 5. 任务管理 (Tasks)

#### GET /api/v1/tasks
获取任务列表

**查询参数**:
- `page`, `limit`, `search`, `sort`, `order`: 通用分页和搜索参数
- `type`: 任务类型 (CRAWL, PARSE_PDF, GENERATE_ABSTRACT, INDEX_PAGE)
- `status`: 任务状态 (PENDING, RUNNING, COMPLETED, FAILED)
- `priority`: 优先级 (1-10)

#### POST /api/v1/tasks
创建任务

**请求体**:
```json
{
  "type": "CRAWL",
  "priority": 5,
  "payload": {
    "url": "https://example.com",
    "source": "arxiv"
  },
  "scheduled_at": "2024-01-01T00:00:00Z"
}
```

### 6. 统计分析 (Statistics)

#### GET /api/v1/stats/overview
获取系统概览统计

**响应示例**:
```json
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

### 7. 搜索功能 (Search)

#### GET /api/v1/search
全文搜索

**查询参数**:
- `q`: 搜索关键词 (必需)
- `type`: 搜索类型 (papers, authors, conferences, all)
- `page`, `limit`: 分页参数

**响应示例**:
```json
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

## 🔧 错误处理

### 错误响应格式

```json
{
  "success": false,
  "message": "错误描述",
  "error": "错误类型"
}
```

### 常见HTTP状态码

- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

## 📝 使用示例

### 创建完整的论文记录流程

1. **创建机构**:
```bash
curl -X POST http://localhost:3000/api/v1/institutions \
  -H "Content-Type: application/json" \
  -d '{
    "name": "清华大学",
    "type": "UNIVERSITY",
    "country": "China",
    "city": "Beijing"
  }'
```

2. **创建作者**:
```bash
curl -X POST http://localhost:3000/api/v1/authors \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "email": "zhangsan@tsinghua.edu.cn",
    "institution_id": "institution_uuid"
  }'
```

3. **创建会议**:
```bash
curl -X POST http://localhost:3000/api/v1/conferences \
  -H "Content-Type: application/json" \
  -d '{
    "name": "International Conference on Machine Learning",
    "acronym": "ICML",
    "status": "UPCOMING"
  }'
```

4. **创建论文**:
```bash
curl -X POST http://localhost:3000/api/v1/papers \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deep Learning for Natural Language Processing",
    "abstract": "This paper presents...",
    "conference_id": "conference_uuid",
    "author_ids": ["author_uuid"],
    "keywords": ["deep learning", "NLP"]
  }'
```

## 🚀 下一步开发计划

1. **认证和授权**: 添加JWT认证和角色权限控制
2. **文件上传**: 支持PDF文件上传和解析
3. **批量操作**: 支持批量导入和导出
4. **Webhook**: 添加事件通知机制
5. **缓存优化**: 实现Redis缓存层
6. **API限流**: 添加请求频率限制

---

*API文档将随着功能开发持续更新*
