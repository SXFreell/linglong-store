/**
 * 应用配置状态管理模块
 * 使用 Zustand 管理全局配置，并通过 @tauri-store/zustand 实现配置持久化
 */
import { create } from 'zustand'
import { createTauriStore } from '@tauri-store/zustand'

/**
 * 创建应用配置状态管理store
 * 管理更新检查和基础服务显示等全局配置
 */
export const useConfigStore = create<Store.Config>((set) => ({
  /** 是否启用版本检查功能的标志 */
  checkVersion: false,
  /** 是否显示基础服务应用的标志 */
  showBaseService: false,

  /** 点击关闭时是直接关闭还是最小化到托盘 */
  closeOrHide: 'hide',
  /**
   * 更改版本检查功能的状态
   * @param value - 新的版本检查状态
   */
  changeCheckVersionStatus: (value: boolean) => set((_state) => ({
    checkVersion: value,
  })),

  /**
   * 更改基础服务显示状态
   * @param value - 新的基础服务显示状态
   */
  changeBaseServiceStatus: (value: boolean) => set((_state) => ({
    showBaseService: value,
  })),
  /** 更改点击关闭时记录的状态 */

  changeCloseOrHide: (value: string) => set((_state) => ({
    closeOrHide: value,
  })),
}))

export const useDownloadConfigStore = create<Store.DownloadConfig>((set) => ({
  // 下载应用保存列表
  downloadList: [],
  // 追加app到下载列表
  addAppToDownloadList: (app: API.APP.AppMainDto | Store.DownloadApp) => set((state) => ({
    // 确保 push 的对象包含 flag 字段（默认空字符串）
    downloadList: [...state.downloadList, { ...(app as API.APP.AppMainDto), flag: 'downloading' }],
  })),
  // 改变APP下载状态(已下载和下载中)
  changeAppDownloadStatus: (appId: string, status = 'downloaded') => set((state) => ({
    downloadList: state.downloadList.map((app: Store.DownloadApp) => {
      if (app.appId === appId) {
        // 返回新的对象以保持不可变性
        return { ...app, flag: status }
      }
      return app
    }),

  })),
  // 清空下载列表
  clearDownloadList: () => set((state) => ({
    downloadList: state.downloadList.filter((app: Store.DownloadApp) => app.flag === 'downloading'),
  })),
  // 移除下载中的应用
  removeDownloadingApp: (appId: string) => set((state) => ({
    downloadList: state.downloadList.filter((app: Store.DownloadApp) => app.appId !== appId),
  })),
}))

/**
 * 全局应用配置的持久化存储实例
 * 使用 @tauri-store/zustand 将配置保存到本地磁盘
 * @param saveOnChange - 配置变更时自动保存
 * @param autoStart - 应用启动时自动初始化
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tauriAppConfigHandler = createTauriStore('ConfigStore', useConfigStore as any, {
  saveOnChange: true, // 配置变更时自动保存到磁盘
  autoStart: true, // 应用启动时自动从磁盘加载配置
})

// 保存下载列表
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tauriDownloadConfigHandler = createTauriStore('downloadConfigStore', useDownloadConfigStore as any, {
  saveOnChange: true, // 配置变更时自动保存到磁盘
  autoStart: true, // 应用启动时自动从磁盘加载配置
})
