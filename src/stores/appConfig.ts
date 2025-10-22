import { create } from 'zustand'
import { createTauriStore } from '@tauri-store/zustand'

type ConfigStore = {
  checkVersion: boolean;// 启动App自动检测商店版本
  showBaseService:boolean; // 显示基础运行服务
  changeCheckVersionStatus:(value:boolean) => void; // 切换版本检查状态
  changeBaseServiceStatus:(value:boolean) => void; // 切换基础服务显示
};

export const useConfigStore = create<ConfigStore>((set) => ({
  checkVersion: false,
  showBaseService: false,

  changeCheckVersionStatus: (value:boolean) => set((_state) => ({
    checkVersion: value,
  })),
  changeBaseServiceStatus: (value:boolean) => set((_state) => ({
    showBaseService: value,
  })),
}))

// 全局应用配置存储实例
export const tauriAppConfigHandler = createTauriStore('ConfigStore', useConfigStore, {
  saveOnChange: true,
  autoStart: true,
})
