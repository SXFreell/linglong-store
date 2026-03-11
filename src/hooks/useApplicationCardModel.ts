import { useCallback, useMemo } from 'react'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { useUpdatesStore } from '@/stores/updates'
import { useInstallQueueStore } from '@/stores/installQueue'
import { useAppInstall } from '@/hooks/useAppInstall'
import { useAppUninstall } from '@/hooks/useAppUninstall'
import compareVersions from '@/util/checkVersion'

type CardState = {
  isInstalled: boolean
  hasUpdate: boolean
  isInstalling: boolean
}

export const useApplicationCardModel = () => {
  const installedApps = useInstalledAppsStore(state => state.installedApps)
  const updates = useUpdatesStore(state => state.updates)
  const currentTask = useInstallQueueStore(state => state.currentTask)
  const queue = useInstallQueueStore(state => state.queue)
  const { handleInstall } = useAppInstall()
  const { uninstall } = useAppUninstall()

  const installedVersionMap = useMemo(() => {
    const map = new Map<string, string>()

    installedApps.forEach((app) => {
      if (!app.appId || !app.version) {
        return
      }

      const currentVersion = map.get(app.appId)
      if (!currentVersion || compareVersions(app.version, currentVersion) > 0) {
        map.set(app.appId, app.version)
      }
    })

    return map
  }, [installedApps])

  const updateAppIdSet = useMemo(() => {
    return new Set(
      updates
        .map(update => update.appId)
        .filter((appId): appId is string => Boolean(appId)),
    )
  }, [updates])

  const installingAppIdSet = useMemo(() => {
    const set = new Set<string>()

    if (currentTask?.appId) {
      set.add(currentTask.appId)
    }

    queue.forEach((task) => {
      if (task.appId) {
        set.add(task.appId)
      }
    })

    return set
  }, [currentTask, queue])

  const getCardState = useCallback((appInfo?: Pick<API.APP.AppMainDto, 'appId' | 'version'>): CardState => {
    const appId = appInfo?.appId || ''
    if (!appId) {
      return {
        isInstalled: false,
        hasUpdate: false,
        isInstalling: false,
      }
    }

    const installedVersion = installedVersionMap.get(appId)
    const isInstalled = Boolean(installedVersion)
    const hasVersionUpdate = Boolean(
      appInfo?.version && installedVersion && compareVersions(appInfo.version, installedVersion) > 0,
    )

    return {
      isInstalled,
      hasUpdate: updateAppIdSet.has(appId) || hasVersionUpdate,
      isInstalling: installingAppIdSet.has(appId),
    }
  }, [installedVersionMap, updateAppIdSet, installingAppIdSet])

  return {
    getCardState,
    handleInstall,
    uninstall,
  }
}
