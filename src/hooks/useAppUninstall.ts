import { useCallback } from 'react'
import { message, Modal } from 'antd'
import { getRunningLinglongApps, uninstallApp } from '@/apis/invoke'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { useUpdatesStore } from '@/stores/updates'
import { sendUninstallRecord } from '@/services/analyticsService'

type UninstallOptions = {
  /** 所有版本卸载完后的回调（例如跳转） */
  onAllRemoved?: () => void
  /** 是否静默，不弹出全局提示 */
  silent?: boolean
  /** 跳过确认弹窗 */
  skipConfirm?: boolean
  /** 自定义标题 */
  confirmTitle?: string
  /** 自定义文案 */
  confirmMessage?: string
}

type BasicAppInfo = {
  appId?: string
  version?: string
  name?: string
  zhName?: string
  arch?: string
  module?: string
  channel?: string
}

/**
 * 统一的卸载逻辑
 */
export const useAppUninstall = () => {
  const { removeApp } = useInstalledAppsStore()
  const checkUpdates = useUpdatesStore(state => state.checkUpdates)

  const performUninstall = useCallback(
    async(appId: string, version: string, appInfo?: BasicAppInfo, options?: UninstallOptions) => {
      try {
        await uninstallApp(appId, version)

        removeApp(appId, version)

        const currentInstalled = useInstalledAppsStore.getState().installedApps
        const remainingVersions = currentInstalled.filter(item => item.appId === appId && item.version !== version)
        if (remainingVersions.length === 0 && options?.onAllRemoved) {
          options.onAllRemoved()
        }

        await checkUpdates(true)

        // 发送卸载统计记录（异步，不阻塞主流程）
        sendUninstallRecord({
          appId,
          name: appInfo?.name,
          version,
          arch: appInfo?.arch,
          module: appInfo?.module,
          channel: appInfo?.channel,
        }).catch((err) => console.warn('[useAppUninstall] sendUninstallRecord failed:', err))

        if (!options?.silent) {
          message.success('卸载成功')
        }
        return true
      } catch (error) {
        if (!options?.silent) {
          message.error(`卸载失败: ${error}`)
        }
        throw error
      }
    },
    [removeApp, checkUpdates],
  )

  const uninstall = useCallback(
    async(appInfo: BasicAppInfo, options?: UninstallOptions) => {
      const appId = appInfo.appId || ''
      const version = appInfo.version || ''

      if (!appId || !version) {
        message.error('应用信息不完整')
        return false
      }

      const confirmTitle = options?.confirmTitle ?? '确认卸载'
      const confirmMessage =
        options?.confirmMessage ??
        `确认要卸载 ${appInfo.zhName || appInfo.name || appId} 的版本 ${version} 吗？`

      if (options?.skipConfirm) {
        return performUninstall(appId, version, appInfo, options)
      }

      const isRunning = await (async() => {
        try {
          const runningApps = await getRunningLinglongApps() as Array<{ name?: string }>
          return runningApps.some(app => app.name === appId)
        } catch (err) {
          console.warn('[useAppUninstall] Failed to check running apps:', err)
          return false
        }
      })()

      if (isRunning) {
        return new Promise<boolean>((resolve) => {
          Modal.confirm({
            title: `${appInfo.zhName || appInfo.name || appId}  正在运行`,
            content: '是否强制关闭后继续卸载？',
            okText: '强制关闭并卸载',
            okButtonProps: { type: 'default' },
            cancelText: '取消卸载',
            cancelButtonProps: { type: 'primary' },
            onOk: async() => {
              try {
                const result = await performUninstall(appId, version, appInfo, options)
                resolve(result)
              } catch (error) {
                resolve(false)
                console.error('Uninstall failed:', error)
              }
            },
            onCancel: () => resolve(false),
          })
        })
      }

      return new Promise<boolean>((resolve) => {
        Modal.confirm({
          title: confirmTitle,
          content: confirmMessage,
          okText: '确认',
          cancelText: '取消',
          onOk: async() => {
            try {
              const result = await performUninstall(appId, version, appInfo, options)
              resolve(result)
            } catch (error) {
              resolve(false)
              console.error('Uninstall failed:', error)
            }
          },
          onCancel: () => resolve(false),
        })
      })
    },
    [performUninstall],
  )

  return { uninstall }
}
