/**
 * 应用配置状态管理模块
 * 使用 Zustand 管理全局配置，并通过 tauri-plugin-store 实现配置持久化
 */
import { create } from 'zustand'
import { Store } from 'tauri-plugin-store-api'

// 创建持久化存储实例
const configStore = new Store('.config.dat')
const downloadConfigStore = new Store('.download-config.dat')

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
  addAppToDownloadList: (app: API.APP.AppMainDto | Store.DownloadApp) => set((state) => {
    // 检查是否已存在该应用
    const existingIndex = state.downloadList.findIndex(item => item.appId === app.appId)

    if (existingIndex !== -1) {
      // 如果已存在，更新该应用的信息
      const newList = [...state.downloadList]
      newList[existingIndex] = { ...(app as API.APP.AppMainDto), flag: 'downloading' }
      return { downloadList: newList }
    }

    // 如果不存在，追加到列表
    return {
      downloadList: [...state.downloadList, { ...(app as API.APP.AppMainDto), flag: 'downloading' }],
    }
  }),
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
  // 更新APP安装进度
  updateAppProgress: (appId: string, percentage: number, status: string) => set((state) => {
    return {
      downloadList: state.downloadList.map((app: Store.DownloadApp) => {
        if (app.appId === appId) {
          return {
            ...app,
            percentage,
            installStatus: status,
            // 如果达到100%，将状态改为已下载
            flag: percentage >= 100 ? 'downloaded' : 'downloading',
          }
        }
        return app
      }),
    }
  }),
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
 * 全局应用配置的持久化存储
 * 使用 tauri-plugin-store 将配置保存到本地磁盘
 */

// 加载配置
export const tauriAppConfigHandler = {
  start: async() => {
    const checkVersion = await configStore.get('checkVersion')
    const showBaseService = await configStore.get('showBaseService')
    const closeOrHide = await configStore.get('closeOrHide')
    
    useConfigStore.setState({
      checkVersion: checkVersion !== null ? checkVersion as boolean : false,
      showBaseService: showBaseService !== null ? showBaseService as boolean : false,
      closeOrHide: closeOrHide !== null ? closeOrHide as string : 'hide',
    })
  },
  save: async() => {
    const state = useConfigStore.getState()
    await configStore.set('checkVersion', state.checkVersion)
    await configStore.set('showBaseService', state.showBaseService)
    await configStore.set('closeOrHide', state.closeOrHide)
    await configStore.save()
  },
}

// 加载下载配置
export const tauriDownloadConfigHandler = {
  start: async() => {
    const downloadList = await downloadConfigStore.get('downloadList')
    if (downloadList) {
      // 过滤掉正在下载中的残留数据
      const filteredList = (downloadList as Store.DownloadApp[]).filter((app: Store.DownloadApp) => app.flag !== 'downloading')
      useDownloadConfigStore.setState({ downloadList: filteredList })
    }
  },
  save: async() => {
    const state = useDownloadConfigStore.getState()
    await downloadConfigStore.set('downloadList', state.downloadList)
    await downloadConfigStore.save()
  },
}

// 自动保存配置（监听变化）
useConfigStore.subscribe(() => {
  tauriAppConfigHandler.save().catch(console.error)
})

useDownloadConfigStore.subscribe(() => {
  tauriDownloadConfigHandler.save().catch(console.error)
})
