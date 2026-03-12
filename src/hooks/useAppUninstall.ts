import { useCallback } from 'react'
import { message, Modal } from 'antd'
import { getRunningLinglongApps, uninstallApp } from '@/apis/invoke'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { sendUninstallRecord } from '@/services/analyticsService'
import { syncAfterAppChange } from '@/utils/appChangeSync'
import { useI18n } from '@/i18n'
import { getAppDisplayName } from '@/utils/appDisplay'

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
  const { t, locale } = useI18n()
  const removeApp = useInstalledAppsStore(state => state.removeApp)

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

        // 卸载后统一同步（强制检查更新，已安装列表已做乐观更新无需全量刷新）
        await syncAfterAppChange({ forceCheckUpdates: true, refreshInstalledApps: false })

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
          message.success(t('hooks.appUninstall.uninstallSuccess'))
        }
        return true
      } catch (error) {
        if (!options?.silent) {
          message.error(t('hooks.appUninstall.uninstallFailed', { error: String(error) }))
        }
        throw error
      }
    },
    [removeApp, t],
  )

  const uninstall = useCallback(
    async(appInfo: BasicAppInfo, options?: UninstallOptions) => {
      const appId = appInfo.appId || ''
      const version = appInfo.version || ''

      if (!appId || !version) {
        message.error(t('hooks.appUninstall.incompleteAppInfo'))
        return false
      }

      if (options?.skipConfirm) {
        return performUninstall(appId, version, appInfo, options)
      }

      // 检查应用是否运行中
      const isRunning = await (async() => {
        try {
          const runningApps = await getRunningLinglongApps() as Array<{ name?: string }>
          return runningApps.some(app => app.name === appId)
        } catch (err) {
          console.warn('[useAppUninstall] Failed to check running apps:', err)
          return false
        }
      })()

      // 根据运行状态构建弹窗配置
      const appDisplayName = getAppDisplayName(appInfo, locale, appId)
      let modalConfig = {}
      if (options?.confirmTitle || options?.confirmMessage) {
        modalConfig = {
          title: options.confirmTitle,
          content: options.confirmMessage,
          okText: t('hooks.appUninstall.confirmUninstall'),
        }
      } else {
        modalConfig = isRunning
          ? {
            title: t('hooks.appUninstall.runningTitle', { appName: appDisplayName }),
            content: t('hooks.appUninstall.runningContent'),
            okText: t('hooks.appUninstall.forceCloseAndUninstall'),
          }
          : {
            title: t('hooks.appUninstall.confirmUninstall'),
            content: t('hooks.appUninstall.confirmUninstallContent', { appName: appDisplayName, version }),
            okText: t('hooks.appUninstall.confirmUninstall'),
          }
      }


      // 统一的弹窗处理
      return new Promise<boolean>((resolve) => {
        Modal.confirm({
          ...modalConfig,
          cancelText: t('common.actions.cancel'),
          okButtonProps: { type: 'default' },
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
    },
    [locale, performUninstall, t],
  )

  return { uninstall }
}
