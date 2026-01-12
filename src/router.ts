import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView/index.vue";
import SettingsView from "./views/SettingsView/index.vue";
import NoteView from "./views/NoteView.vue";
import TaskGraphView from "./views/TaskGraphView/index.vue";
import TaskMenuView from "./views/TaskMenuView/index.vue";
import TaskSummaryView from "./views/TaskSummaryView/index.vue";
import TestPageView from "./views/TestPageView.vue";
import LocalFromView from "./views/LocalFromView.vue";
import GitFromView from "./views/GitFromView.vue";

export const router = createRouter({
  history: createWebHistory(),
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
          name: "note",
          component: NoteView,
        },
        {
          path: "test-page",
          name: "testPage",
          component: TestPageView,
        },
      ],
    },
    {
      path: "/launch-local",
      name: "localWorkspace",
      component: LocalFromView,
    },
    {
      path: "/launch-cloud",
      name: "cloudWorkspace",
      component: GitFromView,
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
