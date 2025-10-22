# 应用过滤功能说明

## 过滤规则
只展示 `kind` 字段为 `"app"` 的玲珑应用，过滤掉：
- `kind: "runtime"` - 运行时环境
- `kind: "base"` - 基础环境
- 其他类型的应用

## 实现方式

### 1. Rust 后端过滤 (第一层)
在 `src-tauri/src/services/installed.rs` 中：

```rust
// 在解析 JSON 后添加过滤
let apps: Vec<InstalledApp> = list_items
    .into_iter()
    .filter(|item| {
        // 只保留 kind 为 "app" 的应用
        item.kind.as_ref().map_or(false, |k| k == "app")
    })
    .map(|item| {
        // ... 数据转换逻辑
    })
    .collect();
```

**作用位置：**
- `get_installed_apps()` - 获取普通应用列表
- `get_all_installed_apps()` - 获取包含基础服务的列表

### 2. 前端直接使用后端过滤结果
在 `src/stores/installedApps.ts` 中：

```typescript
// 调用 Tauri 命令获取已安装应用（后端已过滤）
const apps = includeBaseService
  ? await getAllInstalledLinglongApps()
  : await getInstalledLinglongApps()

set({ installedApps: apps, loading: false })
```

**优势：**
- 高性能：过滤在 Rust 后端完成，速度更快
- 减少数据传输：只传输需要的数据到前端
- 前端逻辑简洁：直接使用后端数据，无需额外处理

## 示例数据对比

### 原始数据 (ll-cli list --json 输出)
```json
[
  {
    "id": "org.deepin.calculator",
    "kind": "app",  // ✅ 会显示
    "name": "deepin-calculator"
  },
  {
    "id": "org.deepin.runtime.dtk",
    "kind": "runtime",  // ❌ 会被过滤
    "name": "deepin runtime"
  },
  {
    "id": "org.deepin.base",
    "kind": "base",  // ❌ 会被过滤
    "name": "deepin-base"
  }
]
```

### 过滤后的数据
```json
[
  {
    "id": "org.deepin.calculator",
    "kind": "app",
    "name": "deepin-calculator"
  }
]
```

## ESLint 规范遵守

代码完全遵守项目的 ESLint 规范：

✅ **无尾随空格** - `no-trailing-spaces`
✅ **函数括号前无空格** - `space-before-function-paren: 'never'`
✅ **使用单引号** - `quotes: 'single'`
✅ **不使用分号** - `semi: 'never'`
✅ **多行尾随逗号** - `comma-dangle: 'always-multiline'`
✅ **花括号包裹条件语句** - `curly: 'error'`
✅ **2空格缩进** - `indent: 2`
✅ **console 语句添加注释禁用** - `no-console: 'warn'`

## 测试建议

1. **验证过滤功能**
   ```bash
   # 在系统中安装不同类型的玲珑应用
   ll-cli install org.deepin.calculator  # app
   ll-cli install org.deepin.runtime.dtk  # runtime
   
   # 查看商店只显示 calculator，不显示 runtime
   ```

2. **检查配置项**
   - 关闭"显示基础服务"时，应该只显示普通应用
   - 即使数据中有 runtime/base，也不应该显示

3. **边界情况**
   - kind 字段为空
   - kind 字段为其他值
   - 没有安装任何应用

## 配置说明

`showBaseService` 配置项的影响：
- `false`: 调用 `get_installed_linglong_apps()` - 只获取应用（已过滤）
- `true`: 调用 `get_all_installed_linglong_apps()` - 获取所有类型（也会过滤）

**注意：** 无论配置如何，最终都只会显示 `kind: "app"` 的应用。过滤完全在 Rust 后端完成，保证高性能。
