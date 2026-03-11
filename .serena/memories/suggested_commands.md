# 开发命令

## 开发
```bash
# 开发模式 (dev 环境)
pnpm dev

# 开发模式 (test 环境)
pnpm dev:test

# 开发模式 (pro 环境)
pnpm dev:pro
```

## 构建
```bash
# 构建 (dev 环境)
pnpm build

# 构建 (test 环境)
pnpm build:test

# 构建 (pro 环境)
pnpm build:pro
```

## 代码质量
```bash
# ESLint 检查
pnpm lint

# ESLint 检查并自动修复
pnpm lint:fix
```

## 其他
```bash
# 预览构建产物
pnpm preview

# 直接运行 Tauri CLI
pnpm tauri <command>
```

## 任务完成后检查清单
1. 运行 `pnpm lint` 确保无 ESLint 错误
2. 确保 TypeScript 编译无错误
3. 测试相关功能是否正常工作