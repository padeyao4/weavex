# Weavex

<div align="center">

**DAG-driven tasks & notes management**

[![License](https://img.shields.io/badge/License-PolyForm_Noncommercial-yellow)](./LICENSE.md)
[![Version](https://img.shields.io/badge/version-0.3.6-blue)](https://github.com/padeyao4/weavex/releases)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen)](https://vuejs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-orange)](https://tauri.app/)

Weavex 是一款基于有向无环图（DAG）的桌面应用，用于以图的方式组织和管理你的任务列表，同时支持将笔记关联到 DAG 中的节点上，实现任务与知识的可视化、结构化管理。

</div>

## ✨ 功能特性

- **DAG 任务管理** - 使用有向无环图组织任务，支持任务依赖与层级关系的可视化
- **笔记集成** - 每个节点可以挂载 Markdown 笔记，实现笔记与任务的双向关联
- **多视图支持** - 图形画布视图与列表/看板视图互相联动，满足不同使用场景
- **本地优先** - 图结构与笔记元数据存储于 SQLite（`weavex.db`），笔记正文以 Markdown 文件存放于 `notes/` 目录；应用设置存放于 `config.json`；全部数据位于存储目录，不依赖云端服务，可随目录整体备份与迁移
- **纯本地存储** - 无 Git 同步、无远程仓库，数据完全由本地掌控
- **自动更新** - 基于 Tauri updater 从 GitHub Releases 自动更新到新版本
- **跨平台桌面应用** - 基于 Tauri 构建，提供原生桌面应用体验
- **智能布局** - 内置嵌套 DAG 布局算法（dagre），自动优化节点布局，保持图形清晰易读

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.77.2
- npm 或 pnpm

### 安装与启动

```bash
# 克隆项目
git clone https://github.com/padeyao4/weavex.git
cd weavex

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 构建应用

```bash
# 构建桌面应用
npm run build
```

## 📖 使用指南

### 启动与存储目录
1. 首次启动：应用自动在系统文档目录下创建默认存储目录 `WeavexData`，并生成默认配置文件 `config.json`，无需任何手动操作
2. 之后每次启动：应用读取上次使用的存储目录，加载其中的 `config.json`；若目录为新目录或缺少配置文件，则自动生成默认配置
3. 任务图结构与笔记元数据保存在存储目录下的 `weavex.db`（SQLite）中，笔记正文保存为 `notes/*.md` 文件；旧版 `graphs.json` / `note-meta.json` 会在首次启动时自动迁移进 SQLite

### 创建任务图
1. 在画布上点击 "+" 按钮创建新节点
2. 输入任务名称和描述
3. 通过拖拽连接线建立任务依赖关系
4. 右键节点可打开上下文菜单进行更多操作

### 添加笔记
1. 双击节点进入编辑模式
2. 在节点详情面板中切换到"笔记"标签
3. 使用内置 Markdown 编辑器编写笔记
4. 笔记将与该节点永久关联

### 视图切换
- **图形视图**：直观展示任务依赖关系
- **列表视图**：以传统列表形式展示任务
- **看板视图**：按状态分类展示任务（待办、进行中、已完成）

## 🛠️ 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **图表引擎**: [AntV G6](https://g6.antv.vision/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **桌面应用**: [Tauri](https://tauri.app/)
- **样式处理**: [Tailwind CSS](https://tailwindcss.com/)
- **数据持久化**: SQLite（`weavex.db`，DAG 图结构与笔记元数据，Rust rusqlite 数据层）+ Markdown 文件（笔记正文 `notes/` 目录）+ JSON 配置文件（`config.json`，应用设置，位于存储目录内）
- **自动更新**: @tauri-apps/plugin-updater + GitHub Releases

## 🧪 测试

```bash
# 运行单元测试（Vitest）
npm run test
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进 Weavex！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 开发规范
- 代码风格遵循 ESLint 和 Prettier 配置
- 提交信息使用约定式提交规范
- 新功能需包含相应测试用例

## 📄 许可证

此项目采用 PolyForm Noncommercial License - 查看 [LICENSE.md](./LICENSE.md) 文件了解详情

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Tauri](https://tauri.app/) - 为 Web 应用构建安全、可靠的轻量级桌面应用
- [AntV G6](https://g6.antv.vision/) - 图可视化框架
- [Element Plus](https://element-plus.org/) - 基于 Vue 3 的组件库
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先的 CSS 框架
