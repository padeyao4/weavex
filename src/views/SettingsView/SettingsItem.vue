<template>
    <div class="item">
        <div class="left">
            <p class="title">
                <slot name="title"> 标题 </slot>
            </p>
            <p class="description">
                <slot name="description"> 描述 </slot>
            </p>
        </div>
        <div class="right">
            <slot name="option"> </slot>
        </div>
    </div>
</template>
<style scoped>
.item {
    display: flex;
    flex-direction: row;
    padding: 8px 0;
    border-bottom: 1px solid #00000030;
}
.left {
    flex-direction: row;
    flex-grow: 1;
    width: 100%;
    padding-right: 12px;
}
.right {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
}
.title {
    margin: 0 4px 0 0;
    color: #00000090;
    font-size: 16px;
}
.description {
    margin: 0 4px 0 0;
    color: #00000080;
    font-size: 13px;
}
</style>
