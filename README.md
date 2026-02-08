# Weavex

<div align="center">

**DAG-driven tasks & notes management**

[![License](https://img.shields.io/github/license/weavex-project/weavex)](LICENSE.md)
[![Version](https://img.shields.io/badge/version-0.3.3-blue)](https://github.com/weavex-project/weavex/releases)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen)](https://vuejs.org/)
[![Tauri](https://img.shields.io/badge/Tauri-2.x-orange)](https://tauri.app/)

Weavex 是一款基于有向无环图（DAG）的桌面应用，用于以图的方式组织和管理你的任务列表，同时支持将笔记关联到 DAG 中的节点上，实现任务与知识的可视化、结构化管理。

</div>

## ✨ 功能特性

- **DAG 任务管理** - 使用有向无环图组织任务，支持任务依赖与层级关系的可视化
- **笔记集成** - 每个节点可以挂载 Markdown 笔记，实现笔记与任务的双向关联
- **多视图支持** - 图形画布视图与列表/看板视图互相联动，满足不同使用场景
- **本地优先** - 数据本地存储，支持持久化与导入/导出功能
- **跨平台桌面应用** - 基于 Tauri 构建，提供原生桌面应用体验

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.77.2
- npm 或 pnpm

### 安装与启动

```bash
# 克隆项目
git clone <repository-url>
cd weavex

# 安装依赖
npm install

# 启动前端开发服务器
npm run dev

# 启动 Tauri 桌面应用开发模式
npm run app:dev
```

### 构建应用

```bash
# 构建前端
npm run build

# 构建桌面应用
npm run app:build
```

## 🛠️ 技术栈

- **前端框架**: [Vue 3](https://vuejs.org/) + [TypeScript](https://www.typescriptlang.org/)
- **UI 组件库**: [Element Plus](https://element-plus.org/)
- **图表引擎**: [G6](https://g6.antv.vision/)
- **状态管理**: [Pinia](https://pinia.vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **桌面应用**: [Tauri](https://tauri.app/)
- **样式处理**: [Tailwind CSS](https://tailwindcss.com/)

## 🧪 测试

```bash
# 运行测试
npm run test
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来帮助改进 Weavex！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 [MIT License](LICENSE.md)。

## 🙏 致谢

- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Tauri](https://tauri.app/) - 为 Web 应用构建安全、可靠、轻量级的桌面应用
- [AntV G6](https://g6.antv.vision/) - 图可视化框架
- [Element Plus](https://element-plus.org/) - 基于 Vue 3 的组件库
