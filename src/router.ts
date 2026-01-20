import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "./views/HomeView/index.vue";
import SettingsView from "./views/SettingsView/index.vue";
import NoteMenuView from "./views/NoteMenuView.vue";
import TaskGraphView from "./views/TaskGraphView/index.vue";
import TaskMenuView from "./views/TaskMenuView/index.vue";
import TaskSummaryView from "./views/TaskSummaryView/index.vue";
import TestPageView from "./views/TestPageView.vue";
import LocalFormView from "./views/LocalFormView.vue";
import GitFormView from "./views/GitFormView.vue";
import LaunchView from "./views/LaunchView.vue";
import LoadingView from "./views/LoadingView.vue";
import { debug } from "@tauri-apps/plugin-log";
import NoteEditor from "./views/NoteEditor.vue";

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
      path: "/launchView",
      name: "LaunchView",
      component: LaunchView,
    },
    {
      path: "/LocalFormView",
      name: "LocalFormView",
      component: LocalFormView,
    },
    {
      path: "/GitFormView",
      name: "GitFormView",
      component: GitFormView,
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
