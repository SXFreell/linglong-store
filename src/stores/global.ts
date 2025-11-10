/**
 * 全局状态管理模块
 * 包含应用初始化状态和搜索功能的状态管理
 */
import { create } from 'zustand'

export const useGlobalStore = create<Store.Global>((set) => ({
  isInited: false,
  arch: '',
  repoName: 'stable',
  updateAppNum: 0,
  onInited: () => set(() => ({ isInited: true })),
  setArch: (value: string) => set(() => ({
    arch: value,
  })),
  setRepoName: (value: string) => set(() => ({
    repoName: value,
  })),
  getUpdateAppNum: (num: number) => set(() => ({
    updateAppNum: num,
  })),
}))

// /**
//  * 创建应用初始化状态管理store
//  * 管理应用启动时的初始化状态、系统架构信息和更新计数
//  */
// export const useInitStore = create<InitStore>((set) => ({
//   /** 应用初始化加载状态标志 */
//   loadingInit: false,
//   /** 需要更新的应用数量 */
//   updateAppNum: 0,
//   /** 系统架构信息（如 x86_64, aarch64 等） */
//   arch: '',
//   /** 当前使用的仓库名称 */
//   repoName: 'stable',

//   /**
//    * 标记应用已完成初始化
//    * 设置 loadingInit 为 true，表示初始化加载完成
//    */
//   onInited: () => set((_state) => ({ loadingInit: true })),

//   /**
//    * 更新需要更新的应用数量
//    * @param num - 需要更新的应用数量
//    */
//   getUpdateAppNum: (num: number) => set((_state) => ({ updateAppNum: num })),

//   /**
//    * 更新系统架构信息
//    * @param value - 系统架构标识符
//    */
//   changeArch: (value: string) => set((_state) => ({
//     arch: value,
//   })),

//   /**
//    * 切换软件源仓库
//    * @param value - 仓库名称
//    */
//   changeRepoName: (value: string) => set((_state) => ({
//     repoName: value,
//   })),
// }))

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
