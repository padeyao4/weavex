import { createRouter, createWebHashHistory } from "vue-router";
import LoadingView from "./views/LoadingView.vue";
import { debug } from "@tauri-apps/plugin-log";

// 路由级懒加载：首屏只需 LoadingView，其余视图按需加载，
// 避免启动时同步解析全部视图（TaskGraphView/G6/NoteEditor 等大模块）
const HomeView = () => import("./views/HomeView/index.vue");
const SettingsView = () => import("./views/SettingsView/index.vue");
const NoteMenuView = () => import("./views/NoteMenuView/index.vue");
const TaskGraphView = () => import("./views/TaskGraphView/index.vue");
const TaskMenuView = () => import("./views/TaskMenuView/index.vue");
const TaskSummaryView = () => import("./views/TaskSummaryView/index.vue");
const TestPageView = () => import("./views/TestPageView.vue");
const NoteEditor = () => import("./views/NoteEditor.vue");

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/home",
      name: "home",
      component: HomeView,
      children: [
        {
          path: "task",
          component: TaskMenuView,
          name: "taskMenu",
          redirect: { name: "taskSummary" },
          children: [
            {
              path: "summary",
              name: "taskSummary",
              component: TaskSummaryView,
            },
            {
              path: "graph/:taskId",
              name: "taskGraph",
              component: TaskGraphView,
            },
          ],
        },
        {
          path: "note",
          name: "noteMenu",
          component: NoteMenuView,
          children: [
            {
              path: "editor/:noteId",
              name: "noteEditor",
              component: NoteEditor,
            },
          ],
        },
        {
          path: "test-page",
          name: "testPage",
          component: TestPageView,
        },
      ],
    },
    {
      path: "/loading",
      name: "loading",
      component: LoadingView,
    },
    {
      path: "/settings",
      name: "settings",
      component: SettingsView,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/home/task/summary",
    },
  ],
});

router.beforeEach(async (to, from, next) => {
  debug(`router.beforeEach: ${from.fullPath} -> ${to.fullPath}`);
  next();
});

export default router;
