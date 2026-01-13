import { debug } from "@tauri-apps/plugin-log";

/**
 * 测量函数时间
 * @param fn
 * @returns
 * @example
 *
 * ```
 * await measureTime(() => {
 *  executeLayout(model, {
 *     ...options,
 *     ...this.options,
 *   });
 * });
 * ```
 */
export async function measureTime<T>(
  fn: () => T, // 接收一个无参函数
  msg?: string,
): Promise<{
  result: T extends Promise<any> ? Awaited<T> : T;
  duration: number;
}> {
  const start = performance.now();
  let result: any;

  try {
    result = await Promise.resolve(fn()); // 调用无参函数
  } finally {
    const end = performance.now();
    const duration = end - start;
    debug(
      `measureTime: ${msg || fn.name || "unknown"} , duration: ${duration}ms`,
    );
    return { result, duration };
  }
}
