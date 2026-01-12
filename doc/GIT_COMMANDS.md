# Git 命令使用文档

## 概述

本项目实现了通过Tauri调用系统Git命令的功能，提供了`git_clone`、`git_pull`、`git_commit`和`git_push`四个主要的Git操作命令。这些命令可以在前端通过JavaScript/TypeScript调用。

## Rust后端命令

### GitOptions 结构体

所有Git命令都使用相同的`GitOptions`结构体作为参数：

```rust
struct GitOptions {
    branch: String,           // 分支名称
    repo_url: String,         // 仓库URL
    target_dir: String,       // 目标目录
    username: Option<String>, // 用户名（可选）
    password: Option<String>, // 密码（可选）
    ssh_key: Option<String>,  // SSH密钥路径（可选）
    auth_method: String,      // 认证方式："https"、"ssh" 或 "none"
    commit_message: Option<String>, // 提交消息（仅commit命令需要）
    files: Option<Vec<String>>,    // 要提交的文件列表（可选）
}
```

### 可用命令

#### 1. git_clone
克隆远程仓库到本地目录。

**参数要求：**
- `repo_url`: 必须提供
- `target_dir`: 必须提供
- `branch`: 可选，默认为空（使用默认分支）
- `auth_method`: 根据URL类型自动选择或手动指定

**认证方式：**
- `https`: 使用用户名和密码认证
- `ssh`: 使用SSH密钥认证
- `none`: 无需认证（公开仓库）

#### 2. git_pull
从远程仓库拉取更新到本地。

**参数要求：**
- `target_dir`: 必须提供（已存在的Git仓库目录）
- `branch`: 可选，指定要拉取的分支
- `auth_method`: 根据克隆时的认证方式设置

#### 3. git_commit
提交本地更改到Git仓库。

**参数要求：**
- `target_dir`: 必须提供（已存在的Git仓库目录）
- `commit_message`: 必须提供
- `files`: 可选，指定要提交的文件列表。如果为空，则提交所有更改

#### 4. git_push
推送本地提交到远程仓库。

**参数要求：**
- `target_dir`: 必须提供（已存在的Git仓库目录）
- `branch`: 可选，指定要推送的分支。如果为空，则推送当前分支
- `auth_method`: 根据克隆时的认证方式设置

## 前端调用示例

### TypeScript调用示例

```typescript
import { invoke } from '@tauri-apps/api/core'

// 克隆仓库示例
async function cloneRepository() {
  try {
    const options = {
      repo_url: 'https://github.com/username/repository.git',
      target_dir: '/path/to/local/directory',
      branch: 'main',
      auth_method: 'https',
      username: 'your-username',
      password: 'your-password',
      ssh_key: null,
      commit_message: null,
      files: null
    }

    const result = await invoke<string>('git_clone', { options })
    console.log('克隆成功:', result)
  } catch (error) {
    console.error('克隆失败:', error)
  }
}

// 提交更改示例
async function commitChanges() {
  try {
    const options = {
      repo_url: 'https://github.com/username/repository.git',
      target_dir: '/path/to/local/directory',
      branch: 'main',
      auth_method: 'https',
      username: null,
      password: null,
      ssh_key: null,
      commit_message: 'Fix: 修复了一些bug',
      files: ['src/main.js', 'README.md'] // 可选，指定要提交的文件
    }

    const result = await invoke<string>('git_commit', { options })
    console.log('提交成功:', result)
  } catch (error) {
    console.error('提交失败:', error)
  }
}

// 拉取更新示例
async function pullUpdates() {
  try {
    const options = {
      repo_url: 'https://github.com/username/repository.git',
      target_dir: '/path/to/local/directory',
      branch: 'main',
      auth_method: 'https',
      username: 'your-username',
      password: 'your-password',
      ssh_key: null,
      commit_message: null,
      files: null
    }

    const result = await invoke<string>('git_pull', { options })
    console.log('拉取成功:', result)
  } catch (error) {
    console.error('拉取失败:', error)
  }
}

// 推送更改示例
async function pushChanges() {
  try {
    const options = {
      repo_url: 'https://github.com/username/repository.git',
      target_dir: '/path/to/local/directory',
      branch: 'main',
      auth_method: 'https',
      username: 'your-username',
      password: 'your-password',
      ssh_key: null,
      commit_message: null,
      files: null
    }

    const result = await invoke<string>('git_push', { options })
    console.log('推送成功:', result)
  } catch (error) {
    console.error('推送失败:', error)
  }
}
```

### Vue组件使用示例

项目中已经实现了一个完整的Git操作测试组件，位于：
`src/components/git/GitTest.vue`

该组件提供了：
1. Git配置表单（仓库URL、目标目录、分支、认证方式等）
2. 提交配置（提交消息、要提交的文件）
3. 四个Git操作按钮（克隆、拉取、提交、推送）
4. 操作结果展示
5. 操作日志记录

## 认证方式说明

### HTTPS认证
- 使用用户名和密码
- URL格式：`https://github.com/username/repository.git`
- 认证方式设置为：`auth_method: 'https'`
- 需要在URL中包含认证信息或通过git凭据管理器

### SSH认证
- 使用SSH密钥
- URL格式：`git@github.com:username/repository.git`
- 认证方式设置为：`auth_method: 'ssh'`
- 需要提供SSH密钥路径：`ssh_key: '/path/to/private/key'`

### 无需认证
- 公开仓库
- 认证方式设置为：`auth_method: 'none'`

## 错误处理

所有Git命令都返回`Result<String, String>`类型，前端需要处理可能的错误：

```typescript
try {
  const result = await invoke<string>('git_clone', { options })
  // 处理成功结果
} catch (error) {
  // 处理错误
  console.error('Git操作失败:', error)
  
  // 错误信息可能包含：
  // 1. 命令执行失败（如git命令不存在）
  // 2. 认证失败
  // 3. 网络问题
  // 4. 权限问题
  // 5. 仓库不存在等
}
```

## 注意事项

1. **系统要求**：目标系统必须安装Git命令行工具
2. **路径格式**：Windows系统使用正斜杠或双反斜杠作为路径分隔符
3. **权限问题**：确保应用有权限访问目标目录和SSH密钥文件
4. **网络连接**：操作需要网络连接访问远程仓库
5. **大文件处理**：对于大仓库，克隆操作可能需要较长时间

## 测试

项目提供了两种测试方式：

1. **Git测试组件**：`src/components/git/GitTest.vue`
   - 完整的UI界面
   - 实时操作反馈
   - 日志记录

2. **Git配置页面**：`src/views/GitFromView.vue`
   - 集成在应用流程中
   - 支持URL类型自动检测
   - 提供克隆和拉取功能

## 扩展建议

如需扩展更多Git功能，可以参考以下方向：

1. **添加更多Git命令**：
   - `git_status`: 查看仓库状态
   - `git_branch`: 分支管理
   - `git_checkout`: 切换分支
   - `git_merge`: 合并分支
   - `git_log`: 查看提交历史

2. **增强错误处理**：
   - 更详细的错误分类
   - 重试机制
   - 进度反馈

3. **性能优化**：
   - 异步执行长时间操作
   - 进度条显示
   - 后台任务管理

## 相关文件

- `src-tauri/src/lib.rs`: Rust后端实现
- `src/components/git/GitTest.vue`: Git测试组件
- `src/views/GitFromView.vue`: Git配置页面
- `src-tauri/Cargo.toml`: 项目依赖配置