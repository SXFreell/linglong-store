# 代码风格与规范

## TypeScript 配置
- 严格模式 (`strict: true`)
- 未使用变量检查 (`noUnusedLocals: true`)
- 未使用参数检查 (`noUnusedParameters: true`)
- 路径别名: `@/*` -> `src/*`

## ESLint 规则要点

### 命名约定
- 组件使用 PascalCase
- 变量/函数使用 camelCase
- 常量使用 UPPER_SNAKE_CASE

### 格式化
- 缩进: 2 空格
- 引号: 单引号
- 分号: 不使用分号
- 尾随逗号: 多行时始终添加
- 大括号样式: 1tbs

### TypeScript
- 未使用变量: error (以 `_` 开头的参数除外)
- `any` 类型: warn
- 非空断言: warn

### React
- 使用 JSX Runtime (无需导入 React)
- Hooks 规则: error
- 自闭合组件标签

### 最佳实践
- 使用 `const` 优先
- 使用 `===` 严格相等
- 禁止 `var`
- 禁止 `eval`
- 禁止 `console.log` (允许 warn, error, info)

## 文件组织
- 每个功能模块放在独立目录
- API 层与业务逻辑分离
- 状态管理集中在 stores 目录