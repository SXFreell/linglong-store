/**
 * Store 状态类型定义
 */

// 初始化状态类型
export interface InitStore {
  loadingInit: boolean
  updateAppSum: number
  arch: string
  repoName: string
  changeInitStatus: () => void
  getUpdateAppSum: (num: number) => void
  changeArch: (value: string) => void
  changeRepoName: (value: string) => void
}

// 配置状态类型
export interface ConfigStore {
  checkVersion: boolean
  showBaseService: boolean
  changeCheckVersionStatus: (value: boolean) => void
  changeBaseServiceStatus: (value: boolean) => void
}

// 搜索状态类型
export interface SearchStore {
  keyword: string
  changeKeyword: (value: string) => void
  resetKeyword: () => void
}

// 所有 Store 的联合类型
export type AllStores = InitStore & ConfigStore & SearchStore
