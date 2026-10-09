import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";
import "./assets/css/main.css";
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import ElementPlus from "element-plus";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import {
  Aiming,
  ChartGraph,
  Check,
  Down,
  ExperimentOne,
  Fill,
  ListSuccess,
  MoreOne,
  Notebook,
  Plus,
  Right,
  Round,
  SettingTwo,
  Star,
  SunOne,
  SwitchButton,
} from "@icon-park/vue-next";
import "@icon-park/vue-next/styles/index.css";
import { register, ExtensionCategory } from "@antv/g6";
import "vditor/dist/index.css";
import {
  DagreLayout,
  CustomNode,
  ArchiveTransform,
  CollapsedTransform,
} from "@/lib";
import router from "./router";

const app = createApp(App);

// 按需注册 icon-park 图标（保持 icon-xxx 全局名；具名导入让 tree-shaking 生效，
// 避免全量注册 2000+ 图标拖慢首屏启动）
const iconParkIcons = {
  Aiming,
  ChartGraph,
  Check,
  Down,
  ExperimentOne,
  Fill,
  ListSuccess,
  MoreOne,
  Notebook,
  Plus,
  Right,
  Round,
  SettingTwo,
  Star,
  SunOne,
  SwitchButton,
};
for (const [key, component] of Object.entries(iconParkIcons)) {
  // PascalCase → kebab-case（仅在小写/数字后跟大写处插入连字符，首字母不加）
  const name =
    "icon-" + key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
  app.component(name, component);
}
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia).use(ElementPlus).use(router).mount("#app");

// 注册自定义数据处理器
register(
  ExtensionCategory.TRANSFORM,
  "collapsed-transform",
  CollapsedTransform,
);
register(ExtensionCategory.TRANSFORM, "archive-transform", ArchiveTransform);
register(ExtensionCategory.LAYOUT, "custom-layout", DagreLayout);
register(ExtensionCategory.NODE, "custom-node", CustomNode);
