import { createRouter, createWebHistory } from "vue-router";
import IndexView from "./views/IndexView.vue";
import TasksView from "./views/TasksView.vue";
import NotesView from "./views/NotesView.vue";
import TasksSummeryView from "./views/TasksSummeryView.vue";
import TaskGraphView from "./views/TaskGraphView.vue";
import SettingsView from "./views/SettingsView.vue";
import TestView from "./views/TestView.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/a",
      component: IndexView,
      children: [
        {
          path: "tasks",
          component: TasksView,
          children: [
            {
              path: "summery",
              name: "tasksSummery",
              component: TasksSummeryView,
            },
            {
              path: "graph/:taskId",
              name: "taskGraph",
              component: TaskGraphView,
            },
          ],
        },
        {
          path: "notes",
          component: NotesView,
        },
        {
          path: "test",
          name: "test",
          component: TestView,
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
      redirect: "/a/tasks/summery",
    },
  ],
});
