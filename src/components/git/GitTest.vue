<template>
  <div class="git-test-container">
    <h2>Git 操作测试</h2>

    <div class="form-section">
      <h3>Git 配置</h3>

      <div class="form-group">
        <label>仓库URL:</label>
        <input v-model="gitOptions.repoUrl" placeholder="https://github.com/username/repo.git" />
      </div>

      <div class="form-group">
        <label>目标目录:</label>
        <input v-model="gitOptions.targetDir" placeholder="/path/to/target/directory" />
      </div>

      <div class="form-group">
        <label>分支:</label>
        <input v-model="gitOptions.branch" placeholder="main" />
      </div>

      <div class="form-group">
        <label>认证方式:</label>
        <select v-model="gitOptions.authMethod">
          <option value="https">HTTPS</option>
          <option value="ssh">SSH</option>
          <option value="none">无认证</option>
        </select>
      </div>

      <div v-if="gitOptions.authMethod === 'https'" class="auth-section">
        <div class="form-group">
          <label>用户名:</label>
          <input v-model="gitOptions.username" placeholder="username" />
        </div>

        <div class="form-group">
          <label>密码:</label>
          <input v-model="gitOptions.password" type="password" placeholder="password" />
        </div>
      </div>

      <div v-if="gitOptions.authMethod === 'ssh'" class="auth-section">
        <div class="form-group">
          <label>SSH密钥路径:</label>
          <input v-model="gitOptions.sshKey" placeholder="/path/to/ssh/key" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>提交配置 (用于commit操作)</h3>

      <div class="form-group">
        <label>提交消息:</label>
        <input v-model="gitOptions.commitMessage" placeholder="Fix: some bug" />
      </div>

      <div class="form-group">
        <label>要提交的文件 (逗号分隔):</label>
        <input v-model="filesInput" placeholder="file1.txt, file2.js, src/" />
      </div>
    </div>

    <div class="actions-section">
      <h3>Git 操作</h3>

      <div class="button-group">
        <button @click="handleClone" :disabled="loading.clone" class="btn btn-primary">
          {{ loading.clone ? '克隆中...' : '克隆仓库' }}
        </button>

        <button @click="handlePull" :disabled="loading.pull" class="btn btn-secondary">
          {{ loading.pull ? '拉取中...' : '拉取更新' }}
        </button>

        <button @click="handleCommit" :disabled="loading.commit" class="btn btn-success">
          {{ loading.commit ? '提交中...' : '提交更改' }}
        </button>

        <button @click="handlePush" :disabled="loading.push" class="btn btn-warning">
          {{ loading.push ? '推送中...' : '推送更改' }}
        </button>
      </div>
    </div>

    <div class="results-section">
      <h3>操作结果</h3>

      <div v-if="result" class="result-message" :class="{ 'success': result.success, 'error': !result.success }">
        <strong>{{ result.success ? '成功' : '失败' }}:</strong> {{ result.message }}
      </div>

      <div v-if="error" class="error-message">
        <strong>错误:</strong> {{ error }}
      </div>
    </div>

    <div class="logs-section">
      <h3>操作日志</h3>

      <div class="logs-container">
        <div v-for="(log, index) in logs" :key="index" class="log-entry">
          <span class="log-time">{{ log.timestamp }}</span>
          <span class="log-operation">{{ log.operation }}</span>
          <span class="log-status" :class="{ 'success': log.success, 'error': !log.success }">
            {{ log.success ? '✓' : '✗' }}
          </span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'

interface GitOptions {
  repoUrl: string
  targetDir: string
  branch: string
  authMethod: string
  username?: string
  password?: string
  sshKey?: string
  commitMessage?: string
  files?: string[]
}

interface OperationResult {
  success: boolean
  message: string
}

interface LogEntry {
  timestamp: string
  operation: string
  success: boolean
  message: string
}

// 响应式数据
const gitOptions = ref<GitOptions>({
  repoUrl: '',
  targetDir: '',
  branch: 'main',
  authMethod: 'https',
  username: '',
  password: '',
  sshKey: '',
  commitMessage: '',
  files: []
})

const filesInput = ref('')
const loading = ref({
  clone: false,
  pull: false,
  commit: false,
  push: false
})

const result = ref<OperationResult | null>(null)
const error = ref('')
const logs = ref<LogEntry[]>([])

// 计算属性：将逗号分隔的文件字符串转换为数组
const filesArray = computed(() => {
  if (!filesInput.value.trim()) return []
  return filesInput.value.split(',').map(file => file.trim()).filter(file => file.length > 0)
})

// 工具函数：添加日志
const addLog = (operation: string, success: boolean, message: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.unshift({
    timestamp,
    operation,
    success,
    message
  })

  // 只保留最近的20条日志
  if (logs.value.length > 20) {
    logs.value = logs.value.slice(0, 20)
  }
}

// 工具函数：重置结果和错误
const resetResults = () => {
  result.value = null
  error.value = ''
}

// Git克隆操作
const handleClone = async () => {
  resetResults()
  loading.value.clone = true

  try {
    const options = {
      repo_url: gitOptions.value.repoUrl,
      target_dir: gitOptions.value.targetDir,
      branch: gitOptions.value.branch,
      auth_method: gitOptions.value.authMethod,
      username: gitOptions.value.username || null,
      password: gitOptions.value.password || null,
      ssh_key: gitOptions.value.sshKey || null,
      commit_message: null,
      files: null
    }

    const response = await invoke<string>('git_clone', { options })

    result.value = {
      success: true,
      message: response
    }

    addLog('克隆', true, response)
  } catch (err: any) {
    const errorMessage = err.toString()
    result.value = {
      success: false,
      message: errorMessage
    }
    error.value = errorMessage
    addLog('克隆', false, errorMessage)
  } finally {
    loading.value.clone = false
  }
}

// Git拉取操作
const handlePull = async () => {
  resetResults()
  loading.value.pull = true

  try {
    const options = {
      repo_url: gitOptions.value.repoUrl,
      target_dir: gitOptions.value.targetDir,
      branch: gitOptions.value.branch,
      auth_method: gitOptions.value.authMethod,
      username: gitOptions.value.username || null,
      password: gitOptions.value.password || null,
      ssh_key: gitOptions.value.sshKey || null,
      commit_message: null,
      files: null
    }

    const response = await invoke<string>('git_pull', { options })

    result.value = {
      success: true,
      message: response
    }

    addLog('拉取', true, response)
  } catch (err: any) {
    const errorMessage = err.toString()
    result.value = {
      success: false,
      message: errorMessage
    }
    error.value = errorMessage
    addLog('拉取', false, errorMessage)
  } finally {
    loading.value.pull = false
  }
}

// Git提交操作
const handleCommit = async () => {
  resetResults()
  loading.value.commit = true

  try {
    if (!gitOptions.value.commitMessage?.trim()) {
      throw new Error('提交消息不能为空')
    }

    const options = {
      repo_url: gitOptions.value.repoUrl,
      target_dir: gitOptions.value.targetDir,
      branch: gitOptions.value.branch,
      auth_method: gitOptions.value.authMethod,
      username: gitOptions.value.username || null,
      password: gitOptions.value.password || null,
      ssh_key: gitOptions.value.sshKey || null,
      commit_message: gitOptions.value.commitMessage,
      files: filesArray.value.length > 0 ? filesArray.value : null
    }

    const response = await invoke<string>('git_commit', { options })

    result.value = {
      success: true,
      message: response
    }

    addLog('提交', true, response)
  } catch (err: any) {
    const errorMessage = err.toString()
    result.value = {
      success: false,
      message: errorMessage
    }
    error.value = errorMessage
    addLog('提交', false, errorMessage)
  } finally {
    loading.value.commit = false
  }
}

// Git推送操作
const handlePush = async () => {
  resetResults()
  loading.value.push = true

  try {
    const options = {
      repo_url: gitOptions.value.repoUrl,
      target_dir: gitOptions.value.targetDir,
      branch: gitOptions.value.branch,
      auth_method: gitOptions.value.authMethod,
      username: gitOptions.value.username || null,
      password: gitOptions.value.password || null,
      ssh_key: gitOptions.value.sshKey || null,
      commit_message: null,
      files: null
    }

    const response = await invoke<string>('git_push', { options })

    result.value = {
      success: true,
      message: response
    }

    addLog('推送', true, response)
  } catch (err: any) {
    const errorMessage = err.toString()
    result.value = {
      success: false,
      message: errorMessage
    }
    error.value = errorMessage
    addLog('推送', false, errorMessage)
  } finally {
    loading.value.push = false
  }
}

// 组件挂载时加载示例数据
onMounted(() => {
  // 添加一些示例日志
  addLog('初始化', true, 'Git测试组件已加载')
})
</script>

<style scoped>
.git-test-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.auth-section {
  margin-top: 15px;
  padding: 15px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.actions-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.button-group {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #2196F3;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #0b7dda;
}

.btn-success {
  background-color: #4CAF50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-warning {
  background-color: #ff9800;
  color: white;
}

.btn-warning:hover:not(:disabled) {
  background-color: #e68a00;
}

.results-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.result-message,
.error-message {
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.result-message.success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.result-message.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
}

.logs-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.logs-container {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background-color: white;
}

.log-entry {
  padding: 8px 12px;
  border-bottom: 1px solid #eee;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  min-width: 80px;
}

.log-operation {
  font-weight: 600;
  min-width: 60px;
  color: #333;
}

.log-status {
  font-weight: bold;
  min-width: 20px;
}

.log-status.success {
  color: #4CAF50;
}

.log-status.error {
  color: #f44336;
}

.log-message {
  flex: 1;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
