# Weavex
Weavex — DAG-driven tasks & notes

Weavex 是一款基于有向无环图（DAG）的桌面应用，用于以图的方式组织和管理你的 todo 列表，同时支持将笔记关联到 DAG 中的节点上，实现任务与知识的可视化、结构化管理。该项目基于 Vue 3 + Vite 构建，并使用 Tauri 打包为跨平台桌面应用。

主要功能
- 使用 DAG（有向无环图）组织任务（todo），支持任务依赖与层级关系的可视化。  
- 每个节点可以挂载笔记（Markdown 支持），笔记与节点双向关联。  
- 多视图支持：图形画布视图与列表/看板视图互相联动。  
- 本地优先存储，支持持久化与导入/导出（可扩展为云同步）。  
- 桌面应用体验（通过 Tauri 打包），支持自定义图标与安装包。

快速开始（开发）
- 安装依赖：
  - 使用 npm:
    - `npm install`
- 本地开发（热重载）：
  - `npm run dev`
- 启动 Tauri 开发模式：
  - `npm run app:dev`
- 构建生产发行包：
  - 前端构建：`npm run build`
  - 打包为桌面应用：`npm run app:build`

注意（配置 / 命名）
- 我们已将项目展示名更新为 `Weavex`。如需在项目配置中保持一致，请确认并更新：
  - `package.json` 中的 `name` 字段（建议小写 slug，例如 `weavex`）。  
  - `src-tauri/tauri.conf.json` 中的 `productName`、`identifier`（或 `bundle.identifier`）以及 `app.windows[].title`，确保安装包与窗口标题显示为 `Weavex`。示例标识符格式：`com.<yourname>.weavex`。
- 图标文件：请确认 `src-tauri/icons` 目录中包含用于打包的图标（常见为 ico / icns / png 多尺寸）。

示例说明（你可以在项目中搜索并替换）
- 将 `possible` 替换为 `Weavex`（展示名）并将 `package.json` 的 `name` 改为 `weavex`（slug），以便发布时统一名称与包名。

文档与贡献
- 欢迎贡献：若要提交 issue 或 PR，请基于主分支创建分支并发起合并请求。  
- 代码风格与检查：项目使用 TypeScript + ESLint/Prettier（请遵守现有配置）。  
- 本地测试：`npm run test`（项目使用 Vitest）。

发布与品牌
- 若计划发布到 npm / GitHub /官网，建议：
  - 先确认 `weavex` 在 npm 是否被占用（当前本地检查显示未被 npm 注册）。  
  - 检查 GitHub 用户/组织名与域名（例如 `weavex.com` / `weavex.dev`）的可用性并考虑商标检索（若做商业化发行）。  
  - 保持仓库名与发布包名一致（例如 `weavex` 或 `weavex-desktop`），便于用户搜索。

联系方式
- 项目位于本仓库（当前为本地开发仓库）。如需我替你统一替换 `package.json` / `tauri.conf.json` / `README` 中的名称并提交修改，请明确要使用的 bundle identifier（例如 `com.yourname.weavex`），或告诉我要替换哪些字段。

许可证
