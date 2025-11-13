/**
 * 全局安装进度监听 Hook
 * 监听所有应用的安装进度事件，并更新到下载列表中
 */
import { useEffect } from 'react'
import { onInstallProgress } from '@/apis/invoke'
import { useDownloadConfigStore } from '@/stores/appConfig'

export const useGlobalInstallProgress = () => {
  const { updateAppProgress } = useDownloadConfigStore()

  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupListener = async() => {
      console.log('[useGlobalInstallProgress] Setting up global install progress listener')

      unlisten = await onInstallProgress((progress) => {
        console.log('[useGlobalInstallProgress] Progress event received:', progress)

        // 更新下载列表中对应 App 的进度
        updateAppProgress(progress.appId, progress.percentage, progress.status)
      })

      console.log('[useGlobalInstallProgress] Listener setup complete')
    }

    setupListener()

    // 组件卸载时清理监听器
    return () => {
      console.log('[useGlobalInstallProgress] Cleaning up listener')
      if (unlisten) {
        unlisten()
      }
    }
  }, [updateAppProgress])
}
