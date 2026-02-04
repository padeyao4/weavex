/// <reference types="vite/client" />

interface Window {
  electron?: {
    openPath?: (path: string) => void;
  };
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}
