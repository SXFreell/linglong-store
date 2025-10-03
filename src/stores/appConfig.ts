import { create } from 'zustand'
import { createTauriStore } from '@tauri-store/zustand'
type InitStore = {
  loadingInit: boolean;
  changeInitStatus: () => void;
};
type ConfigStore = {
  checkVersion: boolean;
  showBaseService:boolean
};
// A Zustand store, like any other.
export const useInitStore = create<InitStore>((set) => ({
  loadingInit: false,
  changeInitStatus: () => set((_state) => ({ loadingInit: true })),
}))

export const useConfigStore = create<ConfigStore>((_set) => ({
  checkVersion: false,
  showBaseService: false,
}))
// A handle to the Tauri plugin.
// 需要持久化时使用以下代码
export const tauriHandler = createTauriStore('ConfigStore', useConfigStore)


