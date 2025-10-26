import { create } from 'zustand'
import { createTauriStore } from '@tauri-store/zustand'
import type { ConfigStore } from '@/types/store'

export const useConfigStore = create<ConfigStore>((set) => ({
  checkVersion: false,
  showBaseService: false,

  changeCheckVersionStatus: (value: boolean) => set((_state) => ({
    checkVersion: value,
  })),
  changeBaseServiceStatus: (value: boolean) => set((_state) => ({
    showBaseService: value,
  })),
}))

// 全局应用配置存储实例
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tauriAppConfigHandler = createTauriStore('ConfigStore', useConfigStore as any, {
  saveOnChange: true,
  autoStart: true,
})
