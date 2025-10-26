import { create } from 'zustand'
import type { InitStore, SearchStore } from '@/types/store'

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

export const useSearchStore = create<SearchStore>((set) => ({
  keyword: '',

  changeKeyword: (value: string) => set((_state) => ({
    keyword: value,
  })),
  resetKeyword: () => set((_state) => ({
    keyword: '',
  })),
}))
