<template>
  <div class="flex h-full min-w-0 flex-1 flex-row" ref="containerRef">
    <div class="flex min-w-0 flex-1 flex-col pt-7.5">
      <div
        class="flex h-12 items-center pl-4 select-none"
        data-tauri-drag-region
      >
        <div
          class="overflow-hidden font-sans text-xl text-ellipsis whitespace-nowrap"
        >
          {{ currentGraph?.name }}
        </div>
      </div>
      <div
        id="canvas"
        ref="canvasRef"
        @contextmenu.prevent
        class="min-h-0 min-w-0 flex-1 overflow-hidden border-t border-border bg-canvas"
      />
      <footer
        class="flex h-12 flex-row items-center justify-center gap-2 border-t border-border"
      >
        <el-button
          circle
          icon="Open"
          :type="currentGraph?.showArchive ? 'default' : 'info'"
          @click="toggleArchive"
          :loading="animationPlaying"
          title="归档节点显示"
        />
        <el-button
          circle
          @click="fitView()"
          :loading="animationPlaying"
          title="适应画布大小"
          icon="FullScreen"
        >
        </el-button>
        <el-button
          circle
          @click="fitCenter()"
          :loading="animationPlaying"
          title="居中显示"
          icon="Aim"
        >
        </el-button>
        <el-button
          title="自动归档"
          circle
          icon="Box"
          @click="autoArchive()"
          :loading="animationPlaying"
        />
      </footer>
    </div>
    <template v-if="!isMobile && drawerNode">
      <NodeDetailForm
        :node="drawerNode"
        :graphId="graphId"
        :enableArchive="enableArchive"
        @save="handleSave"
        @cancel="handleCancel"
        class="w-90 border-l border-border bg-surface"
      />
    </template>
    <teleport to="body" v-else-if="drawerNode">
      <NodeDetailDrawer
        :model-value="true"
        :node="drawerNode"
        :graphId="graphId"
        @update:model-value="handleDrawerClose"
        @save="updateNode"
      />
    </teleport>
  </div>
</template>
<script setup lang="ts">
import { useGraphStore } from "@/stores";
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from "vue";
import { useRoute } from "vue-router";
import { PNode } from "@/types";
import NodeDetailDrawer from "./NodeDetailDrawer.vue";
import NodeDetailForm from "@/components/NodeDetailForm.vue";
import { useEventListener, useResizeObserver } from "@vueuse/core";
import { useTaskGraph } from "@/composables/useTaskGraph";

const containerRef = useTemplateRef("containerRef");
const canvasRef = useTemplateRef("canvasRef");
const route = useRoute();
const graphId = route.params.taskId as string;
const graphStore = useGraphStore();
const currentGraph = computed(() => graphStore.getGraph(graphId));

const drawerNode = ref<PNode | null>(null);
const isMobile = ref(false);

const {
  animationPlaying,
  enableEditAnimation,
  disableEditAnimation,
  fitView,
  fitCenter,
  autoArchive,
  toggleArchive,
  resize,
  redraw,
  setNodeStatus,
  clearNodeStatus,
} = useTaskGraph({
  container: "canvas",
  graphId,
  currentGraph,
  drawerNode,
});

const checkScreenWidth = () => {
  isMobile.value = window.innerWidth < 1000;
};

const enableArchive = computed(() => {
  if (!drawerNode.value) return false;
  return graphStore.canBeArchive(
    graphId,
    drawerNode.value.id,
    drawerNode.value.completed,
  );
});

useEventListener("resize", checkScreenWidth);

useResizeObserver([containerRef, canvasRef], (entries) => {
  if (entries[0].target == containerRef.value) {
    resize();
  } else {
    !drawerNode.value && resize();
  }
});

watch(drawerNode, (v, ov) => {
  if (ov) {
    clearNodeStatus(ov.id!, "chosen");
  }
  if (v) {
    setNodeStatus(v.id!, "chosen");
  }
});

onMounted(() => {
  checkScreenWidth();
  // ESC 关闭编辑框（相当于点击取消）
  window.addEventListener("keydown", onKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
});

/**
 * 更新节点
 * @param node
 */
async function updateNode(node: PNode) {
  if (node.isFollowed && !node.completed) {
    setNodeStatus(node.id, "followed");
  } else {
    clearNodeStatus(node.id, "followed");
  }

  enableEditAnimation();
  graphStore.updateNode(graphId, node, {
    persist: true,
    update: true,
  });
  await redraw();
  disableEditAnimation();
  drawerNode.value = null;
}

function handleSave(node: PNode) {
  updateNode(node);
}

function handleCancel() {
  drawerNode.value = null;
}

// ESC 关闭编辑框：仅在编辑框打开时生效，等同于点击“取消”
function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && drawerNode.value) {
    handleCancel();
  }
}

function handleDrawerClose() {
  drawerNode.value = null;
}
</script>
