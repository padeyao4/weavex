import { invoke } from "@tauri-apps/api/core";

export async function readFile(path: string,): Promise<string> {
  return await invoke('read_file', { path, });
}

export async function writeFile(path: string, content: string): Promise<void> {
  return await invoke('write_file', { path, content });
}
