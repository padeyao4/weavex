import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import SettingsView from "./views/SettingsView.vue";
import NoteView from "./views/NoteView.vue";
import TaskGraphView from "./views/TaskGraphView.vue";
import TaskMenuView from "./views/TaskMenuView.vue";
import TaskSummaryView from "./views/TaskSummaryView/index.vue";

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
      ],
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
