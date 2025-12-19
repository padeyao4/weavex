import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import "./assets/css/main.css";
import "element-plus/dist/index.css";
import ElementPlus from "element-plus";
import { router } from "./route";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia).use(ElementPlus).use(router).mount("#app");
