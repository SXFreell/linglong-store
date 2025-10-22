import { create } from 'zustand'
import type { InstalledApp } from '@/apis/types'
import { getInstalledLinglongApps, getAllInstalledLinglongApps } from '@/apis'
import { getAppDetails } from '@/apis/apps'

interface InstalledAppsStore {
  installedApps: InstalledApp[]
  loading: boolean
  error: string | null

  // 获取已安装应用列表
  fetchInstalledApps: (includeBaseService?: boolean) => Promise<void>

  // 更新应用详情（图标等）
  updateAppDetails: () => Promise<void>

  // 更新单个应用的loading状态
  updateAppLoading: (appId: string, version: string, loading: boolean) => void

  // 移除已卸载的应用
  removeApp: (appId: string, version: string) => void

  // 清空列表
  clearApps: () => void
}

export const useInstalledAppsStore = create<InstalledAppsStore>((set, get) => ({
  installedApps: [],
  loading: false,
  error: null,

  fetchInstalledApps: async(includeBaseService = false) => {
    set({ loading: true, error: null })
    try {
      // 调用 Tauri 命令获取已安装应用（后端已过滤）
      const apps = includeBaseService
        ? await getAllInstalledLinglongApps()
        : await getInstalledLinglongApps()

      set({ installedApps: apps, loading: false })

      // 获取应用详情（图标等）
      await get().updateAppDetails()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      set({ error: errorMessage, loading: false })
      // eslint-disable-next-line no-console
      console.error('Failed to fetch installed apps:', error)
    }
  },

  updateAppDetails: async() => {
    const { installedApps } = get()

    if (installedApps.length === 0) {
      return
    }

    try {
      // 调用后端API获取应用详情
      const response = await getAppDetails(installedApps)

      if (response.code === 200 && response.data) {
        const detailsData = Array.isArray(response.data) ? response.data : []

        // 更新应用详情
        const updatedApps = installedApps.map(app => {
          const detail = detailsData.find(
            (d: Record<string, unknown>) => d.appId === app.appId && d.name === app.name && d.version === app.version,
          )

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

        set({ installedApps: updatedApps })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update app details:', error)
      // 不阻断流程，只记录错误
    }
  },

  updateAppLoading: (appId: string, version: string, loading: boolean) => {
    set(state => ({
      installedApps: state.installedApps.map(app =>
        app.appId === appId && app.version === version
          ? { ...app, loading }
          : app,
      ),
    }))
  },

  removeApp: (appId: string, version: string) => {
    set(state => ({
      installedApps: state.installedApps.filter(
        app => !(app.appId === appId && app.version === version),
      ),
    }))
  },

  clearApps: () => {
    set({ installedApps: [], error: null })
  },
}))
