<template>
  <el-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :with-header="false"
    size="360px"
    class="minimalist-drawer"
  >
    <NodeDetailForm
      :node="localNode"
      :graph-id="graphId"
      :enable-archive="enableArchive()"
      @save="handleSave"
      @cancel="handleCancel"
    />
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import type { PNode } from "@/types";
import { useGraphStore } from "@/stores";
import NodeDetailForm from "@/components/NodeDetailForm.vue";

interface Props {
  modelValue: boolean;
  node: PNode;
  graphId: string;
}

interface Emits {
  (e: "update:modelValue", value: boolean): void;
  (e: "save", node: PNode): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const localNode = ref<PNode>({ ...props.node });

const graphStore = useGraphStore();

watch(
  () => props.node,
  (newNode) => {
    localNode.value = { ...newNode };
  },
  { deep: true },
);

const enableArchive = (): boolean => {
  return graphStore.canBeArchive(
    props.graphId,
    props.node.id,
    localNode.value.completed,
  );
};

const handleSave = (node: PNode) => {
  emit("save", node);
  emit("update:modelValue", false);
};

const handleCancel = () => {
  localNode.value = { ...props.node };
  emit("update:modelValue", false);
};
</script>

<style scoped>
.minimalist-drawer :deep(.el-drawer__body) {
  padding: 0;
}
.minimalist-drawer {
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
</style>
