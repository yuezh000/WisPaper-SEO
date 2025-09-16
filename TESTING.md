# WisPaper SEO API Testing Guide

本文档详细介绍了 WisPaper SEO 项目的 API 测试套件，包括如何运行测试、测试覆盖范围以及测试最佳实践。

## 📋 目录

- [测试概览](#测试概览)
- [快速开始](#快速开始)
- [测试结构](#测试结构)
- [运行测试](#运行测试)
- [测试覆盖范围](#测试覆盖范围)
- [CI/CD 集成](#cicd-集成)
- [测试最佳实践](#测试最佳实践)
- [故障排除](#故障排除)

## 🎯 测试概览

WisPaper SEO 项目包含完整的 API 测试套件，覆盖所有核心功能：

### 测试的 API 端点

| API 模块 | 测试文件 | 覆盖功能 |
|---------|---------|---------|
| 机构管理 | `institutions.test.ts` | 增删改查、搜索、分页 |
| 作者管理 | `authors.test.ts` | 增删改查、验证、关联 |
| 会议管理 | `conferences.test.ts` | 增删改查、状态管理 |
| 期刊管理 | `journals.test.ts` | 增删改查、ISSN验证 |
| 论文管理 | `papers.test.ts` | 增删改查、复杂关联 |
| 任务管理 | `tasks.test.ts` | 增删改查、状态流转 |
| 搜索功能 | `search.test.ts` | 全局搜索、多实体查询 |
| 统计功能 | `stats.test.ts` | 数据聚合、性能测试 |

### 测试类型

- **单元测试**: 测试单个 API 端点的功能
- **集成测试**: 测试 API 与数据库的交互
- **错误处理测试**: 测试各种错误场景
- **数据验证测试**: 测试输入验证和业务规则
- **性能测试**: 测试高并发和大量数据场景

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- PostgreSQL 数据库（用于集成测试）

### 安装依赖

```bash
npm install
```

### 运行所有测试

```bash
# 使用 npm 脚本
npm test

# 使用测试脚本
./scripts/test.sh

# 运行特定模块测试
./scripts/test.sh institutions
```

## 📁 测试结构

```
__tests__/
├── api/
│   └── v1/
│       ├── institutions.test.ts    # 机构管理 API 测试
│       ├── authors.test.ts         # 作者管理 API 测试
│       ├── conferences.test.ts     # 会议管理 API 测试
│       ├── journals.test.ts        # 期刊管理 API 测试
│       ├── papers.test.ts          # 论文管理 API 测试
│       ├── tasks.test.ts           # 任务管理 API 测试
│       ├── search.test.ts          # 搜索 API 测试
│       └── stats.test.ts           # 统计 API 测试
├── jest.config.js                  # Jest 配置
├── jest.setup.js                   # Jest 设置文件
└── scripts/
    └── test.sh                     # 测试运行脚本
```

## 🏃‍♂️ 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 监视模式（开发时使用）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage

# CI 环境测试
npm run test:ci
```

### 使用测试脚本

```bash
# 运行所有测试
./scripts/test.sh

# 运行特定模块
./scripts/test.sh institutions
./scripts/test.sh authors
./scripts/test.sh conferences
./scripts/test.sh journals
./scripts/test.sh papers
./scripts/test.sh tasks
./scripts/test.sh search
./scripts/test.sh stats

# 监视模式
./scripts/test.sh watch

# 覆盖率报告
./scripts/test.sh coverage

# CI 模式
./scripts/test.sh ci

# 查看帮助
./scripts/test.sh help
```

### 环境变量

测试使用以下环境变量：

```bash
# 测试环境
NODE_ENV=test

# 测试数据库
DATABASE_URL=postgresql://test:test@localhost:5432/wispaper_seo_test
```

## 📊 测试覆盖范围

### 功能覆盖

每个 API 模块都包含以下测试场景：

#### 1. 基础 CRUD 操作
- ✅ 创建新记录
- ✅ 获取记录列表（分页）
- ✅ 获取单个记录
- ✅ 更新记录
- ✅ 删除记录

#### 2. 数据验证
- ✅ 必填字段验证
- ✅ 数据格式验证（邮箱、URL、ISSN等）
- ✅ 数据范围验证（优先级、评分等）
- ✅ 唯一性约束验证

#### 3. 业务逻辑
- ✅ 关联数据验证
- ✅ 状态流转验证
- ✅ 日期逻辑验证
- ✅ 权限控制验证

#### 4. 错误处理
- ✅ 数据库连接错误
- ✅ 数据不存在错误
- ✅ 验证失败错误
- ✅ 并发冲突错误

#### 5. 性能测试
- ✅ 大量数据查询
- ✅ 并发请求处理
- ✅ 分页性能
- ✅ 搜索性能

### 覆盖率目标

- **语句覆盖率**: > 90%
- **分支覆盖率**: > 85%
- **函数覆盖率**: > 95%
- **行覆盖率**: > 90%

## 🔄 CI/CD 集成

### GitHub Actions

项目配置了完整的 GitHub Actions 工作流：

```yaml
# .github/workflows/test.yml
name: API Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    services:
      postgres:
        image: postgres:15
        # ... 数据库配置
```

### 工作流步骤

1. **环境设置**: 安装 Node.js 和依赖
2. **数据库准备**: 启动 PostgreSQL 测试数据库
3. **代码检查**: 运行 ESLint 和 TypeScript 检查
4. **测试执行**: 运行完整的测试套件
5. **覆盖率报告**: 生成并上传覆盖率报告
6. **安全扫描**: 运行依赖安全审计

### 测试矩阵

- **Node.js 版本**: 18.x, 20.x
- **数据库**: PostgreSQL 15
- **操作系统**: Ubuntu Latest

## 🎯 测试最佳实践

### 1. 测试命名规范

```typescript
describe('/api/v1/institutions', () => {
  describe('GET /api/v1/institutions', () => {
    it('should return list of institutions with pagination', async () => {
      // 测试实现
    })
  })
})
```

### 2. 测试数据管理

```typescript
// 使用 testUtils 创建测试数据
const mockInstitution = testUtils.createMockInstitution({
  id: 'test-id',
  name: 'Test University'
})
```

### 3. Mock 策略

```typescript
// Mock Prisma 客户端
jest.mock('@/lib/prisma', () => ({
  prisma: {
    institution: {
      findMany: jest.fn(),
      create: jest.fn(),
      // ...
    }
  }
}))
```

### 4. 异步测试

```typescript
it('should handle async operations', async () => {
  const response = await GET(request)
  const data = await response.json()
  
  expect(response.status).toBe(200)
  expect(data.success).toBe(true)
})
```

### 5. 错误测试

```typescript
it('should handle database errors', async () => {
  mockPrisma.institution.findMany.mockRejectedValue(
    new Error('Database error')
  )
  
  const response = await GET(request)
  const data = await response.json()
  
  expect(response.status).toBe(500)
  expect(data.success).toBe(false)
})
```

## 🔧 故障排除

### 常见问题

#### 1. 数据库连接失败

```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**解决方案**:
- 确保 PostgreSQL 服务正在运行
- 检查数据库连接字符串
- 验证数据库用户权限

#### 2. 测试超时

```bash
Timeout - Async callback was not invoked within the 10000ms timeout
```

**解决方案**:
- 增加测试超时时间
- 检查异步操作是否正确完成
- 确保 Mock 函数正确返回 Promise

#### 3. Mock 不生效

```bash
TypeError: Cannot read property 'findMany' of undefined
```

**解决方案**:
- 确保 Mock 在测试之前设置
- 检查 Mock 路径是否正确
- 使用 `jest.clearAllMocks()` 清理状态

#### 4. 环境变量问题

```bash
Error: DATABASE_URL is not defined
```

**解决方案**:
- 检查 `.env.test` 文件
- 确保测试环境变量正确设置
- 使用 `process.env.NODE_ENV = 'test'`

### 调试技巧

#### 1. 启用详细日志

```bash
DEBUG=* npm test
```

#### 2. 运行单个测试

```bash
npm test -- --testNamePattern="should return list of institutions"
```

#### 3. 查看覆盖率详情

```bash
npm run test:coverage
open coverage/lcov-report/index.html
```

#### 4. 使用 Jest 调试模式

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📈 性能基准

### 测试执行时间

| 测试模块 | 执行时间 | 测试数量 |
|---------|---------|---------|
| 机构管理 | ~2s | 15 tests |
| 作者管理 | ~3s | 18 tests |
| 会议管理 | ~2s | 12 tests |
| 期刊管理 | ~2s | 14 tests |
| 论文管理 | ~4s | 20 tests |
| 任务管理 | ~2s | 10 tests |
| 搜索功能 | ~3s | 12 tests |
| 统计功能 | ~2s | 8 tests |
| **总计** | **~20s** | **109 tests** |

### 内存使用

- 测试运行期间内存使用: ~150MB
- 峰值内存使用: ~200MB
- 内存泄漏检查: 通过

## 🔮 未来计划

### 即将添加的测试

- [ ] 端到端测试 (E2E)
- [ ] 负载测试
- [ ] 安全测试
- [ ] API 文档测试
- [ ] 兼容性测试

### 测试工具升级

- [ ] 升级到 Jest 30
- [ ] 集成 Playwright
- [ ] 添加性能监控
- [ ] 实现测试数据工厂

## 📞 支持

如果您在测试过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查 GitHub Issues
3. 联系开发团队

---

**最后更新**: 2024年1月
**维护者**: WisPaper SEO 开发团队
