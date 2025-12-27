export function forwardConsole(
  fnName: "log" | "debug" | "info" | "warn" | "error",
  logger: (message: string) => Promise<void>,
) {
  const original = console[fnName];
  console[fnName] = (message) => {
    // 判断message是否字符串,如果不是字符串,转为json字符串
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }

    original(message);
    logger(message);
  };
}
