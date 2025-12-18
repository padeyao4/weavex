<template>
  <div>
    <div style="height: 56px">header {{ taskId }}</div>
    <div style="height: calc(100% - 56px)" id="container"></div>
  </div>
</template>
<script setup lang="ts">
import { useTaskStore } from "@/store/task";
import { convert } from "@/utils";
import { Graph, GraphData } from "@antv/g6";
import { onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { router } from "@/route";

const route = useRoute();
const taskId = route.params.taskId;
const taskStore = useTaskStore();
const task = computed(() => taskStore.getTaskById(taskId as string));

if (task.value) {
  var data: GraphData = convert(task.value!);
} else {
  router.push({ name: "tasksSummery" });
}

onMounted(() => {
  // 创建图实例
  const graph = new Graph({
    container: "container",
    autoFit: "center",
    autoResize: true,
    data,

    // 节点配置
    node: {
      type: (value) => value.type ?? "rect",
      style: {
        fill: "#e6f7ff",
        stroke: "#91d5ff",
        lineWidth: 1,
        radius: 4,
        labelText: (d: any) => d.title,
        labelBackground: true,
        labelBackgroundOpacity: 0.7,
        labelBackgroundRadius: 2,
      },
    },

    // combo配置
    combo: {
      type: "rect",
      style: {
        fill: "rgba(24, 144, 255, 0.1)",
        stroke: "#1890ff",
        lineWidth: 1,
        radius: 4,
        labelText: (d: any) => d.label,
        labelFill: "#1890ff",
        labelFontSize: 14,
        labelFontWeight: "bold",
      },
    },

    // 边配置
    edge: {
      type: "line",
      style: {
        endArrow: true,
      },
    },

    // 交互行为
    behaviors: ["drag-element", "zoom-canvas", "drag-canvas"],

    // 布局配置 - 使用内置的力导向布局
    layout: {
      type: "antv-dagre",
      rankdir: "LR",
      sortByCombo: true,
    },

    // 插件配置
    plugins: [
      {
        type: "grid-line",
        size: 20,
      },
      {
        type: "tooltip",
        trigger: "hover",
      },
    ],
  });
  graph.render();
});
</script>
