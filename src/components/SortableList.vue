<!--
传入的可拖动元素

用法
列子1:
<template>
    <SortableList :list="list" :update="update">
        <template #default="{ item }">
            <div @pointerdown="onPointerDown(item.id)" />
              <div>{{ item.name }}</div>
              <div :data-draggable-move="item.id">button</div>
            </div>
        </template>
    </SortableList>
</template>
例子2:
<SortableList
    :list="taskStore.importantTasks"
    :update="handleDragging"
>
    <template #default="{ item }">
        <TaskItem
            :task="item"
            :data-draggable-move="item.id"
            @toggle-task="toggleTask"
            @toggle-priority="taskStore.toggleTaskPriority"
        />
    </template>
</SortableList>
-->
<script setup lang="ts" generic="T extends { id: string }">
import { reactive } from "vue";
import { useEventListener } from "@vueuse/core";

/**
 * props
 * @param update 更新列表
 * @param list 列表
 * @param handle 指定拖拽元素的属性,默认所有元素都可以拖拽
 */
const {
    update,
    handle = "data-draggable-move",
    list,
    idAttr = "data-draggable-id",
} = defineProps<{
    update: (current: T, other: T) => void;
    list: T[];
    handle?: string;
    idAttr?: string;
}>();

interface Point {
    x: number;
    y: number;
}

interface DragViewModel {
    refsMap: Map<string, HTMLElement>;
    start: Point;
    end: Point;
    origin: Point;
    clone?: HTMLElement; // 拖拽的元素
    target?: HTMLElement; // 点击后选择的元素
}

const viewModel = reactive<DragViewModel>({
    refsMap: new Map<string, HTMLElement>(),
    start: {
        x: 0,
        y: 0,
    },
    end: {
        x: 0,
        y: 0,
    },
    origin: {
        x: 0,
        y: 0,
    },
    clone: undefined,
    target: undefined,
});

function setRefs(id: string, e: Element) {
    e && viewModel.refsMap.set(id, e as HTMLElement);
}

/**
 * 判断两个矩形是否相交
 */
function isIntersect(r1: DOMRect, r2: DOMRect) {
    return !(
        r2.x > r1.x + r1.width ||
        r2.x + r2.width < r1.x ||
        r2.y > r1.y + r1.height ||
        r2.y + r2.height < r1.y
    );
}

/**
 * 判断r1的水平中线是否在线段r2的矩形内
 */
function isInLine(r1: DOMRect, r2: DOMRect) {
    return (
        r2.y <= r1.y + r1.height / 2 && r1.y + r1.height / 2 <= r2.y + r2.height
    );
}

useEventListener(["pointermove"], (e) => {
    if (!viewModel.target || !viewModel.clone) return;
    viewModel.end.x = e.clientX;
    viewModel.end.y = e.clientY;
    viewModel.clone.style.top = `${viewModel.origin.y + viewModel.end.y - viewModel.start.y}px`;
    viewModel.clone.style.left = `${viewModel.origin.x + viewModel.end.x - viewModel.start.x}px`;
    const r1 = viewModel.clone.getBoundingClientRect();
    const draggableEl = Array.from(viewModel.refsMap.values())
        .filter(
            (el) =>
                el.getAttribute(idAttr) !==
                viewModel.target?.getAttribute(idAttr),
        )
        .find((el) => {
            const r2 = el.getBoundingClientRect();
            return isIntersect(r1, r2) && isInLine(r1, r2);
        });
    if (draggableEl) {
        const sourceId = viewModel.target.getAttribute(idAttr);
        const targetId = draggableEl.getAttribute(idAttr);
        const source = list.find((item) => item.id === sourceId);
        const target = list.find((item) => item.id === targetId);
        update(source!, target!);
    }
});

useEventListener(["pointerup", "pointercancel"], () => {
    if (!viewModel.target || !viewModel.clone) return;
    document.body.removeChild(viewModel.clone);
    viewModel.target.style.opacity = "1";
    viewModel.target = undefined;
    viewModel.clone = undefined;
});

function pointerDown(e: PointerEvent) {
    if (e.button !== 0) {
        // 不是鼠标左键退出
        return;
    }
    const clickEl = e.target as HTMLElement;
    if (!clickEl.hasAttribute(handle)) {
        // 不是拖拽元素退出
        return;
    }

    // 记录起始位置
    viewModel.start.x = e.clientX;
    viewModel.start.y = e.clientY;
    viewModel.end.x = e.clientX;
    viewModel.end.y = e.clientY;

    // 获取最底层可拖动元素
    const attrId = clickEl.getAttribute(handle);
    const el = viewModel.refsMap.get(attrId!);
    const bound = el!.getBoundingClientRect();

    // 记录原始位置
    viewModel.origin.x = bound.left;
    viewModel.origin.y = bound.top;

    // 创建克隆元素
    viewModel.clone = el!.cloneNode(true) as HTMLElement;
    viewModel.clone.style.position = "fixed";
    viewModel.clone.style.top = `${bound.top}px`;
    viewModel.clone.style.left = `${bound.left}px`;
    viewModel.clone.style.width = `${bound.width}px`;
    for (let child of viewModel.clone.children) {
        (child as HTMLElement).style.boxShadow =
            "0 0 5px 2px rgba(0, 0, 0, 0.2)";
    }
    document.body.appendChild(viewModel.clone);

    viewModel.target = el!;
    el!.style.opacity = "0";
}
</script>

<template>
    <div
        v-for="item in list"
        :key="item.id"
        :[idAttr]="item.id"
        :ref="(e) => setRefs(item.id!, e as Element)"
        @pointerdown="pointerDown"
    >
        <slot name="default" :item="item" />
    </div>
</template>
