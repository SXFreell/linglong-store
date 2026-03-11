import { create } from 'zustand'
import { appCheckUpdate } from '@/apis/apps'
import { useGlobalStore } from './global'
import { useInstalledAppsStore } from './installedApps'

// ==================== 类型定义 ====================

/**
 * 应用更新信息
 */
export interface UpdateInfo extends API.APP.AppMainDto {
  /** 当前已安装版本 */
  currentVersion: string
}

/**
 * 更新检查 Store 状态接口
 */
interface UpdatesStore {
  /** 可更新的应用列表 */
  updates: UpdateInfo[]
  /** 是否正在检查更新 */
  checking: boolean
  /** 上次检查时间戳 */
  lastChecked: number
  /** 检查更新 */
  checkUpdates: (force?: boolean) => Promise<void>
  /** 启动自动刷新 */
  startAutoRefresh: () => void
  /** 停止自动刷新 */
  stopAutoRefresh: () => void
}

// ==================== 常量配置 ====================

/** 自动刷新间隔（1小时） */
const AUTO_REFRESH_INTERVAL = 60 * 60 * 1000

/** 定时器引用 */
// [类型兼容] 使用 ReturnType<typeof setInterval> 替代 NodeJS.Timeout
// 确保在浏览器和 Node.js 环境中都能正确推断定时器返回值类型
let autoRefreshTimer: ReturnType<typeof setInterval> | null = null

// ==================== 辅助函数 ====================

/**
 * 构建检查更新参数
 * @param installedApps 已安装的应用列表
 * @param arch 系统架构
 * @returns 查询参数数组
 */
function buildCheckUpdateParams(
  installedApps: API.INVOKE.InstalledApp[],
  arch: string,
): API.APP.AppCheckVersionBO[] {
  return installedApps
    .filter(app => app.module !== 'devel')
    .map(app => ({
      appId: app.appId,
      arch,
      version: app.version,
    }))
}

/**
 * 将远程更新数据映射到 Store 格式
 * @param installedApps 已安装的应用列表
 * @param remoteUpdates 远程返回的有更新的应用列表
 * @returns 更新信息列表
 */
function mapRemoteUpdatesToStore(
  installedApps: API.INVOKE.InstalledApp[],
  remoteUpdates: API.APP.AppMainDetailDTO[],
): UpdateInfo[] {
  const updateList: UpdateInfo[] = []
  const installedMap = new Map(installedApps.map(app => [app.appId, app]))

  for (const remoteApp of remoteUpdates) {
    const installedApp = installedMap.get(remoteApp.appId || '')
    if (!installedApp) {
      continue
    }

    updateList.push({
      appId: remoteApp.appId || installedApp.appId,
      name: remoteApp.name || installedApp.name,
      version: remoteApp.version || '',
      currentVersion: installedApp.version,
      description: remoteApp.description || installedApp.description || '',
      icon: remoteApp.icon || installedApp.icon,
      arch: remoteApp.arch || installedApp.arch,
      categoryName: remoteApp.categoryName,
      zhName: remoteApp.zhName || remoteApp.name || installedApp.name,
    })
  }

  return updateList
}

// ==================== Store 定义 ====================

export const useUpdatesStore = create<UpdatesStore>((set, get) => ({
  updates: [],
  checking: false,
  lastChecked: 0,

  /**
   * 检查应用更新
   * 通过批量查询接口获取远程版本信息，与本地版本对比生成更新列表
   * @param force 是否强制检查（忽略正在进行的检查）
   */
  checkUpdates: async(force = false) => {
    const { checking } = get()

    // 防止重复检查
    if (checking && !force) {
      return
    }

    set({ checking: true })

    try {
      // 1. 从 installedApps store 获取已安装列表，避免重复 IPC 调用
      const installedApps = useInstalledAppsStore.getState().installedApps
      if (installedApps.length === 0) {
        set({ updates: [], lastChecked: Date.now() })
        return
      }

      // 2. 获取系统架构
      const arch = useGlobalStore.getState().arch
      if (!arch) {
        console.warn('[checkUpdates] System arch not available')
        return
      }

      // 3. 构建批量查询参数
      const searchParams = buildCheckUpdateParams(installedApps, arch)
      if (searchParams.length === 0) {
        set({ updates: [], lastChecked: Date.now() })
        return
      }

      // 4. 批量查询远程版本信息
      const response = await appCheckUpdate(searchParams)
      if (!response.data) {
        console.warn('[checkUpdates] No data returned from appCheckUpdate')
        set({ updates: [], lastChecked: Date.now() })
        return
      }

      // 5. 处理远程数据，生成更新列表
      const updateList = mapRemoteUpdatesToStore(installedApps, response.data)

      // 6. 更新状态
      set({ updates: updateList, lastChecked: Date.now() })

    } catch (error) {
      console.error('[checkUpdates] Failed to check updates:', error)
    } finally {
      set({ checking: false })
    }
  },

  /**
   * 启动自动刷新
   * 立即执行一次检查，然后每小时自动检查一次
   */
  startAutoRefresh: () => {
    if (autoRefreshTimer) {
      return
    }

    // 立即检查一次
    get().checkUpdates()

    // 设置定时刷新
    autoRefreshTimer = setInterval(() => {
      get().checkUpdates()
    }, AUTO_REFRESH_INTERVAL)
  },

  /**
   * 停止自动刷新
   */
  stopAutoRefresh: () => {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
  },

}))
