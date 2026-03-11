/**
 * 全局状态管理模块
 * 包含应用初始化状态和搜索功能的状态管理
 */
import { create } from 'zustand'

const shallowEqual = (a: Partial<Store.EnvState>, b: Partial<Store.EnvState>) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const key of keys) {
    // @ts-expect-error dynamic compare
    if (a[key] !== b[key]) {
      return false
    }
  }
  return true
}

export const useGlobalStore = create<Store.Global>((set) => ({
  isInited: false,
  arch: '',
  repoName: 'stable',
  // use package.json version as global appVersion
  appVersion: '',
  checking: false,
  installing: false,
  checked: false,
  envReady: false,
  reason: undefined,
  osVersion: '',
  glibcVersion: '',
  kernelInfo: '',
  llVersion: '',
  llBinVersion: '',
  detailMsg: '',
  repos: [],
  isContainer: false,
  // 匿名统计相关
  visitorId: '',
  clientIp: '',
  // 自定义菜单类别
  customMenuCategory: [],
  onInited: () => set(() => ({ isInited: true })),
  setArch: (value: string) => set(() => ({
    arch: value,
  })),
  setRepoName: (value: string) => set(() => ({
    repoName: value,
  })),
  setAppVersion: (value: string) => set(() => ({ appVersion: value })),
  setChecking: (value: boolean) => set(() => ({ checking: value })),
  setInstalling: (value: boolean) => set(() => ({ installing: value })),
  setReason: (value?: string) => set(() => ({ reason: value })),
  setEnvReady: (value: boolean) => set(() => ({ envReady: value })),
  setEnvInfo: (value: Partial<Store.EnvState>) => set((state) => {
    const next = {
      ...state,
      ...value,
      checked: true,
    }
    if (shallowEqual(state, next)) {
      return state
    }
    console.info('[env] setEnvInfo', value)
    return next
  }),
  setVisitorId: (value: string) => set(() => ({ visitorId: value })),
  setClientIp: (value: string) => set(() => ({ clientIp: value })),
  setCustomMenuCategory: (value: API.APP.CustomMenuCategory[]) => set(() => ({ customMenuCategory: value })),
}))

/**
 * 创建搜索状态管理store
 * 管理全局搜索关键词状态
 */
export const useSearchStore = create<Store.Search>((set) => ({
  /** 搜索关键词 */
  keyword: '',

  /**
   * 更新搜索关键词
   * @param value - 新的搜索关键词
   */
  changeKeyword: (value: string) => set((_state) => ({
    keyword: value,
  })),

  /**
   * 重置搜索关键词
   * 将搜索关键词清空
   */
  resetKeyword: () => set((_state) => ({
    keyword: '',
  })),
}))
