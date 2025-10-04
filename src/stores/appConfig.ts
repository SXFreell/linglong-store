import { create } from 'zustand'
import { createTauriStore } from '@tauri-store/zustand'
type InitStore = {
  loadingInit: boolean;
  updateAppSum:number;
  changeInitStatus: () => void;
  getUpdateAppSum: (num:number) => void;
};
type ConfigStore = {
  checkVersion: boolean;
  showBaseService:boolean;
  changeCheckVersionStatus:(value:boolean) => void;
  changeBaseServiceStatus:(value:boolean) => void;
};
type SearchStore = {
 keyword: string;
  changeKeyword:(value:string) => void;
  resetKeyword:() => void;
};
// 软件初始化时，保存初始化状态
export const useInitStore = create<InitStore>((set) => ({
  // 首页查询的各个基础服务是否完成
  loadingInit: false,
  // 需要更新的APP总数量
  updateAppSum: 0,
  // 首页加载完成后状态改为true
  changeInitStatus: () => set((_state) => ({ loadingInit: true })),
  getUpdateAppSum: (num:number) => set((_state) => ({ updateAppSum: num })),
}))

export const useConfigStore = create<ConfigStore>((set) => ({
  // 启动App自动检测商店版本
  checkVersion: false,
  // 显示基础运行服务
  showBaseService: false,
  changeCheckVersionStatus: (value:boolean) => set((_state) => ({
    checkVersion: value,
  })),
  changeBaseServiceStatus: (value:boolean) => set((_state) => ({
    showBaseService: value,
  })),
}))

export const useSearchStore = create<SearchStore>((set) => ({
  // 搜索关键字
  keyword: '',
  changeKeyword: (value:string) => set((_state) => ({
    keyword: value,
  })),
  resetKeyword: () => set((_state) => ({
    keyword: '',
  })),
}))
// A handle to the Tauri plugin.
// 需要持久化时使用以下代码
export const tauriAppConfigHandler = createTauriStore('ConfigStore', useConfigStore, {
  saveOnChange: true,
  autoStart: true,
})


