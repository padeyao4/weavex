# Weavex

<div align="center">

**DAG-driven tasks & notes management**

[![License](https://img.shields.io/badge/License-PolyForm_Noncommercial-yellow)](./LICENSE.md)
[![Version](https://img.shields.io/badge/version-0.3.8-blue)](https://github.com/padeyao4/weavex/releases)
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

## 🤖 MCP 集成

Weavex 内置 **MCP（Model Context Protocol）服务**：AI 助手（豆包、Claude、Cursor 等）可通过标准协议直接读取、创建、修改、删除你的任务图、任务节点、依赖边与笔记，与桌面应用完全同口径。**单 exe 实现，零 Node 依赖**——主程序 `weavex.exe` 加 `--mcp-stdio` 参数即进入 MCP 服务模式（不启动应用窗口），无需安装任何额外组件。

### 架构

- **传输方式**：stdio（标准输入输出上的 JSON-RPC 2.0）
- **Filesystem-first**：MCP 服务直接读写应用的本地数据（`weavex.db` SQLite + `notes/*.md` Markdown），与手动操作完全一致；桌面应用运行时，其文件监视器会自动把外部改动同步到界面，无需额外通知机制
- **入口**：`weavex.exe --mcp-stdio`（Windows 安装版已将该命令加入用户 PATH，新开终端直接可用）

### 工具清单（19 个）

| 分类 | 工具 |
|---|---|
| 项目（图） | `list_graphs` `get_graph` `create_graph` `rename_graph` `delete_graph` |
| 任务节点 | `list_nodes` `get_node` `create_node` `update_node` `delete_node` `toggle_node_completed` `toggle_node_followed` |
| 依赖边 | `add_edge` `remove_edge` |
| 笔记 | `list_notes` `read_note` `create_note` `update_note` `delete_note` |

完整参数与返回约定见 [`skills/weavex/references/tools.md`](./skills/weavex/references/tools.md)。

### 调用方式

```bash
# 安装版（setup.exe 安装后，新开终端）
weavex --mcp-stdio

# 开发版（操作开发数据，不设 --dev 则操作生产数据）
C:\weavex-target\debug\weavex.exe --mcp-stdio --dev

# 指定数据目录（优先级最高，等效环境变量 WEAVEX_DATA_DIR）
weavex --mcp-stdio
```

数据目录解析顺序：`WEAVEX_DATA_DIR` → `--dev` 时 `%APPDATA%\dev.padeyao4.weavex`（否则 `%APPDATA%\padeyao4.weavex`）→ `~/Documents/WeavexData`；目录需存在 `weavex.db` 才被采用。

### MCP 客户端配置

在支持 MCP 的客户端（如豆包连接器）中新增 stdio 服务：

```json
{
  "command": "weavex",
  "args": ["--mcp-stdio"]
}
```

### 技能与回归测试

- **豆包技能**：项目自带 [`skills/weavex`](./skills/weavex/)，含统一调用脚本 `scripts/weavex.ps1`（PowerShell 直调 exe，零 Node 依赖）、19 工具手册与常用工作流
- **端到端回归**：`scripts/test-client.mjs`（25 项断言，覆盖成功与错误路径），用法：

```bash
$env:WEAVEX_DATA_DIR="<测试数据副本目录>"
node scripts/test-client.mjs C:\weavex-target\release\weavex.exe --mcp-stdio
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- Rust >= 1.77.2
- npm 或 pnpm

### 安装与启动

```bash
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

## 📄 许可证

此项目采用 PolyForm Noncommercial License - 查看 [LICENSE.md](./LICENSE.md) 文件了解详情
