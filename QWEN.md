# Possible - Tauri 桌面应用程序

## 项目概述

Possible 是一个使用 Vue.js、TypeScript 和 Tailwind CSS 构建的极简风格 Tauri 桌面应用程序。它是一个生产力应用程序，专注于任务和笔记管理，并使用图形可视化（使用 AntV G6 库）来展示任务关系。该应用程序采用现代技术栈，包括 Pinia 进行状态管理，Element Plus 用于 UI 组件，以及 Tauri 进行跨平台桌面部署，整体设计遵循极简主义原则。

## 架构

- **前端**: Vue 3 配合 TypeScript，使用组合式 API
- **UI 框架**: Element Plus 配合 Tailwind CSS 进行样式设计
- **状态管理**: Pinia 配合持久化状态插件
- **路由**: Vue Router
- **图形可视化**: AntV G6 配合自定义扩展
- **桌面框架**: Tauri 2.0 (基于 Rust)
- **构建工具**: Vite
- **测试**: Vitest

## 主要功能

- 任务管理与可视化图形表示（极简界面设计）
- 笔记功能（简洁直观的体验）
- 设置配置（简约的配置选项）
- 使用 Tauri 的文件系统插件进行持久化存储
- 使用 AntV G6 进行图形可视化（清晰简洁的图形展示）
- 响应式桌面应用程序界面（极简美学）

## 项目结构

```
possible/
├── src/                    # Vue.js 源文件
│   ├── assets/            # 静态资源和样式
│   ├── components/        # Vue 组件
│   ├── lib/               # 自定义库和工具
│   ├── stores/            # Pinia 状态管理
│   ├── views/             # 页面级 Vue 组件
│   ├── router.ts          # Vue Router 配置
│   └── main.ts            # 应用程序入口点
├── src-tauri/             # Tauri/Rust 后端文件
│   ├── src/               # Rust 源文件
│   ├── Cargo.toml         # Rust 依赖
│   ├── tauri.conf.json    # Tauri 生产配置
│   └── tauri.dev.conf.json # Tauri 开发配置
├── public/                # 静态公共资源
├── package.json           # Node.js 依赖和脚本
└── vite.config.ts         # Vite 构建配置
```

## 依赖项

### 主要前端依赖
- Vue 3: 渐进式 JavaScript 框架
- Element Plus: Vue 3 组件库
- AntV G6: 图形可视化库
- Pinia: 状态管理
- Vue Router: 客户端路由
- Tailwind CSS: 实用优先的 CSS 框架

### 主要 Tauri 依赖
- @tauri-apps/api: Tauri JavaScript API
- @tauri-apps/plugin-fs: 文件系统操作
- @tauri-apps/plugin-store: 持久化键值存储
- @tauri-apps/plugin-opener: 打开 URL 和文件
- @tauri-apps/plugin-log: 日志功能

## 构建和运行

### 开发
```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev

# 以开发模式运行 Tauri 应用程序
npm run app:dev
```

### 生产构建
```bash
# 构建生产版本应用程序
npm run build

# 构建 Tauri 应用程序
npm run app:build
```

### 测试
```bash
# 运行测试
npm run test
```

### 预览生产构建
```bash
# 在本地预览生产构建
npm run preview
```

## 开发规范

- 整个应用程序使用 TypeScript 以确保类型安全
- Vue 3 组合式 API 配合 `<script setup>` 语法
- Pinia 存储配合持久化状态
- 基于组件的架构配合 Element Plus 组件
- Tailwind CSS 配合自定义配置进行样式设计，遵循极简美学
- 文件路径使用 `@` 别名指向 `src/`
- 异步操作使用 async/await 处理
- AntV G6 自定义扩展用于图形可视化，保持界面简洁
- Tauri 插件用于原生功能访问
- 代码结构和 UI 设计遵循极简主义原则

## 关键存储

- `context.ts`: 管理应用程序初始化状态（待初始化、初始化中、已初始化、错误）
- `storage.ts`: 处理图形数据存储和持久化
- `task.ts`: 管理任务相关数据和操作

## 路由结构

- `/home` - 主应用程序区域
  - `/home/task` - 任务管理部分
    - `/home/task/summary` - 任务摘要视图
    - `/home/task/graph/:taskId` - 任务的可视化图形表示
  - `/home/note` - 笔记部分
- `/settings` - 应用程序设置
- 将未知路由重定向到 `/home/task/summary`

## 文件系统操作

应用程序使用 Tauri 的文件系统插件来持久化数据，并使用自定义的 `FsUtil` 辅助函数来读写图形和任务数据。

## 图形可视化

应用程序利用 AntV G6 进行图形可视化，并注册了自定义扩展以实现专门的数据转换功能，所有图形展示均遵循极简设计原则，确保信息清晰易读。