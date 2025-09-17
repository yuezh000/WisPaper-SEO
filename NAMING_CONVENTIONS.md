# 命名规范 (Naming Conventions)

## 概述

本文档定义了 wispaper-seo 项目中的命名规范，确保代码的一致性和可维护性。

## 字段命名规范

### API 字段命名
- **API 请求和响应字段**：使用下划线命名法 (snake_case)
- **示例**：
  - `institution_id`
  - `conference_id` 
  - `author_ids`
  - `seo_score`
  - `created_at`
  - `updated_at`

### 代码变量命名
- **JavaScript/TypeScript 变量、函数、对象属性**：使用驼峰命名法 (camelCase)
- **示例**：
  - `institutionId`
  - `conferenceId`
  - `authorIds`
  - `seoScore`
  - `createdAt`
  - `updatedAt`

### 数据库字段命名
- **数据库字段名**：使用下划线命名法 (snake_case)
- **示例**：
  - `institution_id`
  - `conference_id`
  - `seo_score`
  - `created_at`
  - `updated_at`

## 转换规则

### API 到数据库
```javascript
// API 字段 (snake_case) -> 数据库字段 (snake_case)
{
  institution_id: "123",
  conference_id: "456",
  seo_score: 8.5
}
```

### 数据库到 API
```javascript
// 数据库字段 (snake_case) -> API 字段 (snake_case)
{
  institution_id: "123",
  conference_id: "456", 
  seo_score: 8.5
}
```

### 代码内部处理
```javascript
// 代码中使用驼峰命名法
const institutionId = data.institution_id;
const conferenceId = data.conference_id;
const seoScore = data.seo_score;
```

## 实际应用示例

### API 路由处理
```typescript
// 接收 API 请求 (snake_case)
const { institution_id, conference_id } = await request.json();

// 代码内部处理 (camelCase)
const institutionId = institution_id;
const conferenceId = conference_id;

// 数据库操作 (snake_case)
const result = await prisma.paper.create({
  data: {
    institutionId: institutionId,  // Prisma 使用 camelCase
    conferenceId: conferenceId
  }
});

// 返回 API 响应 (snake_case)
return {
  institution_id: result.institutionId,
  conference_id: result.conferenceId
};
```

### 测试数据
```javascript
// 测试数据使用 API 格式 (snake_case)
const testData = {
  institution_id: "123",
  conference_id: "456",
  author_ids: ["789", "012"]
};

// 测试期望使用 API 格式 (snake_case)
expect(response.data.data.institution_id).toBe("123");
```

## 注意事项

1. **API 接口一致性**：所有 API 端点必须使用下划线命名法
2. **代码可读性**：JavaScript/TypeScript 代码使用驼峰命名法提高可读性
3. **数据库兼容性**：数据库字段使用下划线命名法符合 SQL 惯例
4. **测试一致性**：测试数据必须与 API 格式保持一致

## 更新历史

- 2024-12-19: 初始版本，定义 API 字段使用下划线命名法，代码变量使用驼峰命名法
