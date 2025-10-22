# Types 文件夹使用指南

## 📁 目录结构

```
src/types/
├── index.ts          # 导出所有类型的统一入口
├── common.ts         # 通用基础类型
├── api.ts            # API 相关类型
└── store.ts          # Zustand store 类型
```

## 📝 各文件说明

### common.ts - 通用类型
包含项目中常用的基础类型定义：
- `BaseResponse<T>` - HTTP 响应基础接口
- `HttpMethod` - HTTP 请求方法类型
- `PaginationParams` - 分页参数
- `PaginationData<T>` - 分页数据
- `RequestConfig` - 请求配置
- `Status` 枚举 - 通用状态
- `OperationType` 枚举 - 操作类型

### api.ts - API 类型
定义与 API 相关的类型：
- `ApiError` - API 错误类型
- `AppCategory` - 应用分类
- `AppInfo` - 应用信息
- `SearchAppParams` - 搜索参数
- `Template` - 模板类型

### store.ts - Store 类型
定义 Zustand store 的状态类型：
- `InitStore` - 初始化状态
- `ConfigStore` - 应用配置状态
- `SearchStore` - 搜索状态
- `AllStores` - 所有 store 联合类型

## 🚀 使用示例

### 方式一：从统一入口导入（推荐）
```typescript
import type { BaseResponse, PaginationResponse, Category } from '@/types'

const result: BaseResponse<Category[]> = await getCategories()
```

### 方式二：从具体文件导入
```typescript
import type { Category, AppInfo } from '@/types/api'
import type { InitStore } from '@/types/store'

const categories: Category[] = data
const store: InitStore = useInitStore()
```

## 📋 类型分类原则

| 类型范围 | 放置位置 | 说明 |
|---------|---------|------|
| **全局通用基础** | `types/common.ts` | 通用数据结构 |
| **API 相关** | `types/api.ts` 或 `apis/{module}/types.ts` | API 响应/参数 |
| **页面级别** | `pages/{page}/types.ts` | 仅该页面使用 |
| **组件级别** | `components/{comp}/types.ts` | 组件 Props 类型 |
| **Store** | `types/store.ts` | Zustand 状态类型 |

## ✅ 最佳实践

### 1. 始终使用 `type` 关键字导入类型
```typescript
// ✅ 正确
import type { BaseResponse } from '@/types'

// ❌ 避免
import { BaseResponse } from '@/types'
```

### 2. 为 useState 和 API 响应指定类型
```typescript
// ✅ 好的做法
const [categories, setCategories] = useState<Category[]>([])
const result: BaseResponse<Category[]> = await getCategories()

// ❌ 避免
const [categories, setCategories] = useState([])
const result = await getCategories()
```

### 3. 创建具体的响应类型而不是使用 `any`
```typescript
// ✅ 推荐
export type SearchAppResponse = PaginationResponse<AppInfo>

// ❌ 避免
export const getSearchApp = () => post<BaseResponse<any>>('/search')
```

### 4. 为函数参数添加类型
```typescript
// ✅ 好的做法
export const search = (params: SearchAppParams) => {
  return post<SearchAppResponse>('/visit/getSearchAppList', params)
}

// ❌ 避免
export const search = (params: any) => {
  return post<BaseResponse<any>>('/visit/getSearchAppList', params)
}
```

## 🔧 添加新类型时的步骤

1. **确定类型的作用域**
   - 全局通用 → `src/types/`
   - API 模块特定 → `src/apis/{module}/types.ts`
   - 页面特定 → `src/pages/{page}/types.ts`

2. **在对应文件中定义类型**
   ```typescript
   export interface NewType {
     // 字段定义
   }
   ```

3. **如果是全局类型，在 `src/types/index.ts` 中导出**
   ```typescript
   export * from './newfile'
   ```

4. **在组件中使用**
   ```typescript
   import type { NewType } from '@/types'
   ```

## 📚 参考资源

- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
- [React TypeScript 最佳实践](https://react.dev/learn/typescript)
