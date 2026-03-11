/**
 * 已安装应用状态管理模块
 */
import { create } from 'zustand'
import { getInstalledLinglongApps } from '@/apis/invoke'
import { getAppDetails } from '@/apis/apps'
import { message } from 'antd'

/** 从应用列表构建 appId → app 的索引 Map */
function buildAppMap(apps: API.INVOKE.EnrichedInstalledApp[]) {
  return new Map(apps.map(app => [app.appId, app]))
}

/**
 * 创建已安装应用的状态管理store
 * 管理已安装应用列表、需要更新的应用列表、加载状态和错误信息
 */
export const useInstalledAppsStore = create<Store.InstalledApps>((set, get) => ({
  installedApps: [],
  installedAppMap: new Map(),
  fetchInstalledApps: async(includeBaseService = false) => {
    try {
      // 调用 Tauri 命令获取已安装应用（后端已过滤）
      const apps = await getInstalledLinglongApps(includeBaseService)

      // 先尝试补全详情再统一 set，避免中间态导致消费者 double-render
      let enrichedApps = apps as API.INVOKE.EnrichedInstalledApp[]
      try {
        enrichedApps = await enrichWithDetails(apps)
      } catch (error) {
        console.error('Failed to update app details:', error)
        // 详情获取失败仍使用原始列表
      }

      set({ installedApps: enrichedApps, installedAppMap: buildAppMap(enrichedApps) })
    } catch (error) {
      // 错误处理：转换错误信息并更新状态
      message.error('获取已安装应用失败，请重试！')
      console.error('Failed to fetch installed apps:', error)
    }
  },
  updateAppDetails: async() => {
    const { installedApps } = get()
    if (installedApps.length === 0) {
      return
    }

    try {
      const updatedApps = await enrichWithDetails(installedApps)
      set({ installedApps: updatedApps, installedAppMap: buildAppMap(updatedApps) })
    } catch (error) {
      console.error('Failed to update app details:', error)
      message.error('更新应用详情失败，请重试！')
    }
  },
  removeApp: (appId: string, version: string) => {
    set(state => {
      const updatedApps = state.installedApps.filter(
        app => !(app.appId === appId && app.version === version),
      )
      return { installedApps: updatedApps, installedAppMap: buildAppMap(updatedApps) }
    })
  },
  clearApps: () => {
    set({ installedApps: [], installedAppMap: new Map() })
  },
}))

/**
 * 从后端 API 获取应用详情（图标、中文名等）并合并到应用列表
 */
async function enrichWithDetails(
  apps: API.INVOKE.EnrichedInstalledApp[],
): Promise<API.INVOKE.EnrichedInstalledApp[]> {
  if (apps.length === 0) {
    return apps
  }

  const appDetailsVOs: API.APP.AppDetailsVO[] = apps.map(app => ({
    appId: app.appId,
    name: app.name,
    version: app.version,
    channel: app.channel,
    module: app.module,
    arch: app.arch,
  }))

  const response = await getAppDetails(appDetailsVOs)
  const detailsData = Array.isArray(response.data) ? response.data : []
  const detailsMap = new Map(detailsData.map(d => [d.appId, d]))

  return apps.map(app => {
    const detail = detailsMap.get(app.appId)
    if (detail) {
      return {
        ...app,
        icon: detail.icon || app.icon,
        zhName: detail.zhName || app.zhName,
        categoryName: detail.categoryName || app.categoryName,
        description: detail.description || app.description,
      }
    }
    return app
  })
}
