import { create } from 'zustand'

type InitStore = {
  loadingInit: boolean; // 应用是否初始化完成
  updateAppNum: number; // 需要更新的应用总数量
  arch: string; // 系统架构
  repoName: string; // 仓库名称
  onInited: () => void; // 初始化完成时的回调
  getUpdateAppNum: (num: number) => void; // 获取需要更新的应用数量
  changeArch: (value: string) => void; // 更改系统架构
  changeRepoName: (value: string) => void; // 更改仓库名称
};

// 软件初始化时，保存初始化状态，每次打开软件需获取服务
export const useInitStore = create<InitStore>((set) => ({
  loadingInit: false,
  updateAppNum: 0,
  arch: '',
  repoName: 'stable',

  onInited: () => set((_state) => ({ loadingInit: true })),
  getUpdateAppNum: (num: number) => set((_state) => ({ updateAppNum: num })),
  changeArch: (value: string) => set((_state) => ({
    arch: value,
  })),
  changeRepoName: (value: string) => set((_state) => ({
    repoName: value,
  })),
}))

type SearchStore = {
  keyword: string; // 搜索关键词
  changeKeyword: (value: string) => void; // 更改搜索关键词
  resetKeyword: () => void; // 重置搜索关键词
};

export const useSearchStore = create<SearchStore>((set) => ({
  keyword: '',

  changeKeyword: (value: string) => set((_state) => ({
    keyword: value,
  })),
  resetKeyword: () => set((_state) => ({
    keyword: '',
  })),
}))
