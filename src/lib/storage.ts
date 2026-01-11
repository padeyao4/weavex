import {
  Awaitable,
  SerializerAsync,
  StorageLikeAsync,
  useStorageAsync,
} from "@vueuse/core";
import { Store } from "@tauri-apps/plugin-store";
import { MaybeRefOrGetter } from "vue";

type S = string | null;

class ContextStorage implements StorageLikeAsync {
  store?: Store;
  constructor() {
    Store.load("context.bin").then((store) => {
      this.store = store;
    });
  }

  async getItem(key: string): Promise<S> {
    return (await this.store?.get<S>(key)) as S;
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.store?.set(key, value);
  }

  async removeItem(key: string): Promise<void> {
    await this.store?.delete(key);
  }
}

class JsonSerializer implements SerializerAsync<object> {
  read(raw: string): Awaitable<object> {
    return JSON.parse(raw);
  }

  write(value: object): Awaitable<string> {
    return JSON.stringify(value);
  }
}

const contextStorage = new ContextStorage();
const jsonSerializer = new JsonSerializer();

export const useContextStorage = <T>(
  key: string,
  initialValue: MaybeRefOrGetter<T>,
) => {
  return useStorageAsync<T>(key, initialValue, contextStorage, {
    serializer: jsonSerializer as any,
  });
};
