<template>
  <div class="nav-container">
    <div class="nav-items">
      <router-link
        :to="{ name: 'tasksSummery' }"
        class="nav-item"
        :class="{
          active:
            $route.name === 'tasksSummery' ||
            $route.path.startsWith('/a/tasks'),
        }"
      >
        <div class="nav-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="14"
              height="14"
              rx="2"
              :fill="
                $route.name === 'tasksSummery' ||
                $route.path.startsWith('/a/tasks')
                  ? 'var(--vscode-active-background)'
                  : 'var(--vscode-sidebar-background)'
              "
              :stroke="
                $route.name === 'tasksSummery' ||
                $route.path.startsWith('/a/tasks')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-icon-foreground)'
              "
              stroke-width="1.5"
            />
            <path
              d="M7 7H13"
              :stroke="
                $route.name === 'tasksSummery' ||
                $route.path.startsWith('/a/tasks')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M7 10H13"
              :stroke="
                $route.name === 'tasksSummery' ||
                $route.path.startsWith('/a/tasks')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M7 13H10"
              :stroke="
                $route.name === 'tasksSummery' ||
                $route.path.startsWith('/a/tasks')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <div class="nav-label">任务</div>
      </router-link>

      <router-link
        :to="{ name: 'notes' }"
        class="nav-item"
        :class="{ active: $route.name === 'notes' }"
      >
        <div class="nav-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="14"
              height="14"
              rx="2"
              :fill="
                $route.name === 'notes'
                  ? 'var(--vscode-active-background)'
                  : 'var(--vscode-sidebar-background)'
              "
              :stroke="
                $route.name === 'notes'
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-icon-foreground)'
              "
              stroke-width="1.5"
            />
            <path
              d="M7 7H13"
              :stroke="
                $route.name === 'notes'
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M7 10H13"
              :stroke="
                $route.name === 'notes'
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M7 13H13"
              :stroke="
                $route.name === 'notes'
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M15 7V13"
              :stroke="
                $route.name === 'notes'
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <div class="nav-label">笔记</div>
      </router-link>

      <router-link
        :to="{ name: 'test' }"
        class="nav-item"
        :class="{ active: $route.name === 'test' }"
      >
        <div class="nav-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="3"
              y="3"
              width="14"
              height="14"
              rx="2"
              :fill="
                $route.name === 'test'
                  ? 'var(--vscode-active-background)'
                  : 'var(--vscode-sidebar-background)'
              "
              :stroke="
                $route.name === 'test'
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-icon-foreground)'
              "
              stroke-width="1.5"
            />
            <path
              d="M8 7L12 10L8 13"
              :stroke="
                $route.name === 'test'
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle
              cx="14"
              cy="10"
              r="1.5"
              :fill="
                $route.name === 'test'
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
            />
          </svg>
        </div>
        <div class="nav-label">测试</div>
      </router-link>
    </div>

    <div class="nav-footer">
      <router-link
        :to="`/settings`"
        class="nav-item"
        :class="{ active: $route.path.startsWith('/settings') }"
      >
        <div class="nav-icon">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="10"
              cy="10"
              r="6.5"
              :fill="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-active-background)'
                  : 'var(--vscode-sidebar-background)'
              "
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
            />
            <circle
              cx="10"
              cy="10"
              r="2.5"
              :fill="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
            />
            <path
              d="M10 3V5"
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M10 15V17"
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M3 10H5"
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M15 10H17"
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M5.5 5.5L7 7"
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M13 13L14.5 14.5"
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M5.5 14.5L7 13"
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <path
              d="M13 7L14.5 5.5"
              :stroke="
                $route.path.startsWith('/settings')
                  ? 'var(--vscode-focus-border)'
                  : 'var(--vscode-secondary-foreground)'
              "
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </div>
        <div class="nav-label">设置</div>
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
// 组件逻辑
</script>

<style scoped>
.nav-container {
  width: 68px;
  height: 100vh;
  background-color: var(--vscode-sidebar-background);
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--vscode-border);
  user-select: none;
}

.nav-header {
  padding: 16px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid var(--vscode-border);
}

.nav-items {
  flex: 1;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.nav-footer {
  padding: 16px 0;
  border-top: 1px solid var(--vscode-border);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 0;
  text-decoration: none;
  color: var(--vscode-secondary-foreground);
  position: relative;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  color: var(--vscode-foreground);
  background-color: var(--vscode-hover-background);
}

.nav-item.active {
  color: var(--vscode-foreground);
}

.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: var(--vscode-focus-border);
}

.nav-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
}

.nav-item:hover .nav-icon svg rect,
.nav-item:hover .nav-icon svg circle,
.nav-item:hover .nav-icon svg path {
  stroke: var(--vscode-focus-border);
}

.nav-item:hover .nav-icon svg circle[fill] {
  fill: var(--vscode-focus-border);
}

.nav-item.active .nav-icon svg rect,
.nav-item.active .nav-icon svg circle,
.nav-item.active .nav-icon svg path {
  stroke: var(--vscode-focus-border);
}

.nav-item.active .nav-icon svg circle[fill] {
  fill: var(--vscode-focus-border);
}
</style>
