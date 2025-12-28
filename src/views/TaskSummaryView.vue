<script setup lang="ts">
import { faker } from "@faker-js/faker";
const mockList = [];

for (let i = 0; i < 20; i++) {
    mockList.push({
        id: i,
        title: faker.book.author(),
        description: `Description for Todo ${i + 1}`,
        completed: false,
    });
}
</script>

<template>
    <main class="w-full h-screen bg-gray-50 flex">
        <div class="m-4 flex flex-col flex-1">
            <div class="h-14 flex items-center font-medium font-sans text-xl">
                任务列表
            </div>
            <div class="flex-1 flex flex-col gap-2 overflow-y-auto mt-2">
                <div
                    v-for="item in mockList"
                    class="px-2 h-16 bg-amber-100 shrink-0 flex items-center rounded-lg border"
                >
                    <div class="items-center relative flex w-6 h-6 group">
                        <icon-round
                            theme="outline"
                            size="24"
                            fill="#333"
                            :strokeWidth="2"
                            strokeLinecap="square"
                            class="absolute"
                        />
                        <icon-check
                            class="absolute opacity-0 group-hover:opacity-100 pointer-events-none"
                            theme="outline"
                            size="30"
                            fill="#333"
                            :strokeWidth="2"
                            strokeLinecap="square"
                        />
                    </div>
                    <div class="ml-2">
                        {{ item.title }}
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
