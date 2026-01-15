import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import "./assets/css/main.css";
import "element-plus/dist/index.css";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { install } from "@icon-park/vue-next/es/all";
import "@icon-park/vue-next/styles/index.css";
import { register, ExtensionCategory } from "@antv/g6";
import {
  DagreLayout,
  CustomNode,
  ExpandedTransform,
  ArchiveTransform,
  CustomTransform,
} from "@/lib";
import router from "./router";

const app = createApp(App);

// use default prefix 'icon', eg: icon is People, name is icon-people.
install(app);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia).use(ElementPlus).use(router).mount("#app");

// 注册自定义数据处理器
register(ExtensionCategory.TRANSFORM, "custom-transform", CustomTransform);
register(ExtensionCategory.TRANSFORM, "expanded-transform", ExpandedTransform);
register(ExtensionCategory.TRANSFORM, "archive-transform", ArchiveTransform);
register(ExtensionCategory.LAYOUT, "custom-layout", DagreLayout);
register(ExtensionCategory.NODE, "custom-node", CustomNode);
