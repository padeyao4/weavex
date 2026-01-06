<template>
    <div class="h-screen w-screen flex flex-row bg-white overflow-hidden">
        <aside
            class="w-16 bg-gray-200 h-screen flex flex-col shrink-0 items-center gap-4 pt-4 border-gray-300 border-r"
        >
            <router-link
                :to="{ name: 'taskMenu' }"
                class="hover:bg-amber-100 hover:rounded-md flex items-center justify-center h-10 w-10"
                active-class="bg-amber-100 rounded-md"
            >
                <icon-list-success
                    theme="outline"
                    size="24"
                    fill="#333"
                    :strokeWidth="3"
                    strokeLinecap="square"
                />
            </router-link>
            <router-link
                :to="{ name: 'note' }"
                class="hover:bg-amber-100 hover:rounded-md flex items-center justify-center h-10 w-10"
                active-class="bg-amber-100 rounded-md"
            >
                <icon-notebook
                    theme="outline"
                    size="24"
                    fill="#333"
                    :strokeWidth="3"
                    strokeLinecap="square"
                />
            </router-link>
            <router-link
                :to="{ name: 'settings' }"
                active-class="bg-amber-100 rounded-md"
                class="mt-auto mb-2 hover:bg-amber-100 hover:rounded-md p-2 h-10 w-10 flex justify-center align-center"
            >
                <icon-setting-two
                    theme="outline"
                    size="24"
                    fill="#333"
                    :strokeWidth="3"
                    strokeLinecap="square"
                />
            </router-link>
        </aside>
        <router-view />
    </div>
</template>
