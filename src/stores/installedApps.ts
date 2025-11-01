import { create } from 'zustand'
import type { InstalledAppsStore } from '@/types/store'
import { getInstalledLinglongApps, getAllInstalledLinglongApps } from '@/apis/invoke'
import { getAppDetails } from '@/apis/apps'

export const useInstalledAppsStore = create<InstalledAppsStore>((set, get) => ({
  installedApps: [],
  needUpdateApps: [],
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
      console.error('Failed to fetch installed apps:', error)
    }
  },

  updateAppDetails: async() => {
    const { installedApps } = get()

    if (installedApps.length === 0) {
      return
    }

    try {
      // 将已安装应用转换为请求格式
      const appDetailsVOs: API.APP.AppDetailsVO[] = installedApps.map(app => ({
        appId: app.appId,
        name: app.name,
        version: app.version,
        channel: app.channel,
        module: app.module,
        arch: app.arch,
      }))

      // 调用后端API获取应用详情
      const response = await getAppDetails(appDetailsVOs)

      if (response.code === 200 && response.data) {
        const detailsData = Array.isArray(response.data) ? response.data : []

        // 更新应用详情
        const updatedApps = installedApps.map(app => {
          const detail = detailsData.find(
            (d) => d.appId === app.appId && d.name === app.name && d.version === app.version,
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
        // 计算需要更新的应用（same appId，detail.version > installed version）
        const compareVersions = (v1: string, v2: string): number => {
          const a = String(v1).split(/[._-]/).map(s => (s === '' ? 0 : (Number.isNaN(Number(s)) ? s : Number(s))))
          const b = String(v2).split(/[._-]/).map(s => (s === '' ? 0 : (Number.isNaN(Number(s)) ? s : Number(s))))
          const len = Math.max(a.length, b.length)
          for (let i = 0; i < len; i++) {
            const aa: any = a[i] ?? 0
            const bb: any = b[i] ?? 0
            if (typeof aa === 'number' && typeof bb === 'number') {
              if (aa > bb) {
                return 1
              }
              if (aa < bb) {
                return -1
              }
            } else {
              const sa = String(aa)
              const sb = String(bb)
              if (sa > sb) {
                return 1
              }
              if (sa < sb) {
                return -1
              }
            }
          }
          return 0
        }

        const needUpdateApps = installedApps.filter(app => {
          const detail = detailsData.find(d => d.appId === app.appId)

          if (!detail || !detail.version) {
            return false
          }
          // 如果 detail.version 比已安装的 app.version 新，则视为需要更新
          return compareVersions(detail.version, app.version) > 0
        })

        // console.log(needUpdateApps, 'detail for update check')
        // 保存需要更新的应用列表到 store（用于 UI 提示/批量更新等）
        set({ needUpdateApps: needUpdateApps })
      }
    } catch (error) {
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
      needUpdateApps: state.installedApps.filter(
        app => !(app.appId === appId && app.version === version),
      ),
    }))
  },

  clearApps: () => {
    set({ installedApps: [], error: null })
  },
}))
