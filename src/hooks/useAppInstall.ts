/**
 * 应用安装功能的自定义 Hook
 * 统一管理应用安装逻辑，通过安装队列实现串行安装
 *
 * 使用方式：
 * 1. 调用 handleInstall(app) 将应用加入安装队列
 * 2. 队列自动串行处理，单个失败不影响其他任务
 * 3. 通过 getInstallStatus(appId) 获取安装状态
 */
import { useCallback, useMemo } from 'react'
import { message, Modal } from 'antd'
import { useInstallQueueStore } from '@/stores/installQueue'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { isForceRequired } from '@/services/installService'
import { compareVersions } from '@/util/checkVersion'

type AppInfo = API.APP.AppMainDto

/**
 * 安装选项
 */
export interface InstallOptions {
  /** 指定版本 */
  version?: string
  /** 是否强制安装（覆盖已安装版本） */
  force?: boolean
  /** 跳过确认弹窗 */
  skipConfirm?: boolean
}

/**
 * 检查是否需要强制安装（降级安装）
 */
const checkNeedForceInstall = (
  targetVersion: string | undefined,
  installedApps: API.INVOKE.InstalledApp[],
  appId: string,
): { needForce: boolean; installedVersion?: string } => {
  if (!targetVersion) {
    return { needForce: false }
  }

  const installedApp = installedApps.find((app) => app.appId === appId)
  if (!installedApp) {
    return { needForce: false }
  }

  // 如果目标版本低于已安装版本，需要强制安装
  if (compareVersions(installedApp.version, targetVersion) > 0) {
    return { needForce: true, installedVersion: installedApp.version }
  }

  return { needForce: false }
}

/**
 * 确认降级安装弹窗
 */
const confirmDowngradeInstall = (
  installedVersion: string,
  targetVersion: string,
): Promise<boolean> => {
  return new Promise((resolve) => {
    Modal.confirm({
      title: '确认覆盖安装',
      content: `已安装更高版本（${installedVersion}），确认安装旧版本 ${targetVersion} 吗？降级安装可能导致应用无法正常使用。`,
      okText: '继续安装',
      cancelText: '取消',
      centered: true,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}

/**
 * 确认强制安装弹窗（版本已存在）
 */
const confirmForceInstall = (appName: string): Promise<boolean> => {
  return new Promise((resolve) => {
    Modal.confirm({
      title: '版本已安装',
      content: `${appName} 的该版本已安装，是否强制重新安装？`,
      okText: '重新安装',
      cancelText: '取消',
      centered: true,
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    })
  })
}

export interface VersionInstallState {
  task: Store.InstallTask | null
  status: Store.InstallTaskStatus | 'idle'
  activeVersion: string | null
  isActiveVersion: boolean
  isPending: boolean
  isInstalling: boolean
  isBusy: boolean
}

export const useAppInstall = () => {
  const enqueueInstall = useInstallQueueStore((state) => state.enqueueInstall)
  const enqueueBatch = useInstallQueueStore((state) => state.enqueueBatch)
  const isAppInQueue = useInstallQueueStore((state) => state.isAppInQueue)
  const getAppInstallStatus = useInstallQueueStore((state) => state.getAppInstallStatus)
  const currentTask = useInstallQueueStore((state) => state.currentTask)
  const queuedAppCount = useInstallQueueStore((state) => state.queue.length)
  const [messageApi] = message.useMessage()


  /**
   * 安装单个应用
   * @param app - 应用信息
   * @param options - 安装选项
   */
  const handleInstall = useCallback(
    async(app: AppInfo, options?: InstallOptions) => {
      if (!app?.appId) {
        console.error('[useAppInstall] ❌ App ID is missing!')
        messageApi.error('应用信息不完整')
        return
      }

      // 检查是否已在队列中
      if (isAppInQueue(app.appId)) {
        messageApi.warning(`${app.zhName || app.name || app.appId} 已在安装队列中`)
        return
      }

      let force = options?.force ?? false
      const version = options?.version

      // 如果没有跳过确认，检查是否需要强制安装
      if (!options?.skipConfirm) {
        const installedApps = useInstalledAppsStore.getState().installedApps
        const { needForce, installedVersion } = checkNeedForceInstall(version, installedApps, app.appId)

        if (needForce && installedVersion && version) {
          const confirmed = await confirmDowngradeInstall(installedVersion, version)
          if (!confirmed) {
            return
          }
          force = true
        }
      }

      // 加入安装队列
      const taskId = enqueueInstall(app, { version, force })
      console.info(`[useAppInstall] Task enqueued: ${taskId} for app: ${app.appId}`)

      messageApi.info({
        content: `${app.zhName || app.name || app.appId} 开始安装`,
        key: `enqueue-${app.appId}`,
      })
    },
    [enqueueInstall, isAppInQueue, messageApi],
  )

  /**
   * 批量安装应用（用于一键更新）
   * @param apps - 应用列表
   */
  const handleBatchInstall = useCallback(
    (apps: Array<{ appInfo: AppInfo; version?: string; force?: boolean }>) => {
      // 过滤掉已在队列中的应用
      const filteredApps = apps.filter((item) => !isAppInQueue(item.appInfo.appId || ''))

      if (filteredApps.length === 0) {
        messageApi.warning('所有应用都已在安装队列中')
        return []
      }

      const taskIds = enqueueBatch(filteredApps)

      messageApi.info({
        content: `已将 ${taskIds.length} 个应用加入安装队列`,
        key: 'batch-enqueue',
      })

      return taskIds
    },
    [enqueueBatch, isAppInQueue, messageApi],
  )

  /**
   * 获取特定版本的安装状态
   * @param appId - 应用ID
   * @param targetVersion - 需要关注的版本
   * @param fallbackVersion - 当任务未携带版本信息时的兜底版本（通常用于“安装最新”场景）
   */
  const getVersionInstallState = useCallback(
    (appId: string, targetVersion?: string, fallbackVersion?: string): VersionInstallState => {
      if (!appId) {
        return {
          task: null,
          status: 'idle',
          activeVersion: null,
          isActiveVersion: false,
          isPending: false,
          isInstalling: false,
          isBusy: false,
        }
      }

      const task = getAppInstallStatus(appId)
      if (!task) {
        return {
          task: null,
          status: 'idle',
          activeVersion: null,
          isActiveVersion: false,
          isPending: false,
          isInstalling: false,
          isBusy: false,
        }
      }

      const activeVersion = task.version || fallbackVersion || null
      const status = task.status
      const isPending = status === 'pending'
      const isInstalling = status === 'installing'
      const isBusy = isPending || isInstalling
      const isActiveVersion = targetVersion ? activeVersion === targetVersion : !!activeVersion

      return {
        task,
        status,
        activeVersion,
        isActiveVersion,
        isPending,
        isInstalling,
        isBusy,
      }
    },
    [getAppInstallStatus],
  )

  /**
   * 处理安装失败后的重试（带 force 选项）
   * @param app - 应用信息
   * @param errorMessage - 错误消息
   */
  const handleRetryWithForce = useCallback(
    async(app: AppInfo, errorMessage: string) => {
      if (isForceRequired(errorMessage)) {
        const confirmed = await confirmForceInstall(app.zhName || app.name || app.appId || '')
        if (confirmed) {
          // 直接以 force 模式重新入队
          enqueueInstall(app, { force: true })
        }
      }
    },
    [enqueueInstall],
  )

  /**
   * 当前正在安装的应用ID
   */
  const installingAppId = useMemo(() => {
    return currentTask?.appId ?? null
  }, [currentTask])

  /**
   * 队列中等待安装的应用数量
   */
  const queueLength = useMemo(() => {
    return queuedAppCount
  }, [queuedAppCount])

  return {
    /** 当前正在安装的应用ID */
    installingAppId,
    /** 队列中等待安装的应用数量 */
    queueLength,
    /** 安装单个应用 */
    handleInstall,
    /** 批量安装应用 */
    handleBatchInstall,
    /** 处理安装失败后的重试 */
    handleRetryWithForce,
    /** 检查应用是否在队列中 */
    isAppInQueue,
    /** 获取应用安装状态 */
    getInstallStatus: getAppInstallStatus,
    /** 获取指定版本的安装状态 */
    getVersionInstallState,
  }
}
