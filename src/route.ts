import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./views/HomeView.vue";
import SettingsView from "./views/SettingsView.vue";
import TaskSummaryView from "./views/TaskSummaryView.vue";
import TaskView from "./views/TaskView.vue";
import NoteView from "./views/NoteView.vue";
import TaskGraphView from "./views/TaskGraphView.vue";

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
          component: TaskView,
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
