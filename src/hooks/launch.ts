/**
 * 应用启动初始化 Hook
 * 负责应用商店启动时的初始化工作，包括：
 * - 获取系统架构信息
 * - 加载已安装应用列表
 * - 检查应用更新信息
 * - 初始化配置
 * - 恢复中断的安装任务
 * - 初始化匿名统计（如用户允许）
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { arch } from '@tauri-apps/plugin-os'
import { useGlobalStore } from '@/stores/global'
import { useConfigStore } from '@/stores/appConfig'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { useInstallQueueStore } from '@/stores/installQueue'
import { useUpdatesStore } from '@/stores/updates'
import { useUpdateStore } from './useUploadStore'
import { app } from '@tauri-apps/api'
import { useLinglongEnv } from './useLinglongEnv'
import { initAnalytics } from '@/services/analyticsService'

/**
 * 应用启动初始化 Hook
 * @returns {Hooks.Launch.UseLaunchReturn} 初始化状态和控制方法
 */
export const useLaunch = (): Hooks.Launch.UseLaunchReturn => {
  // ==================== 状态管理 ====================
  /** 初始化完成标识 */
  const [isInit, setIsInit] = useState(false)
  /** 初始化进度 */
  const [progress, setProgress] = useState(0)
  /** 错误信息 */
  const [error, setError] = useState<string | null>(null)
  /** 当前步骤 */
  const [currentStep, setCurrentStep] = useState<string>('初始化应用')

  // ==================== 环境状态（统一从 global store 读取，不再维护本地副本） ====================
  const envReady = useGlobalStore((state) => state.envReady)
  const envChecked = useGlobalStore((state) => state.checked)

  // ==================== Store 状态和方法 ====================
  // 状态管理
  const { onInited, setArch, setAppVersion, isContainer } = useGlobalStore()

  // 配置状态
  const { showBaseService, checkVersion } = useConfigStore()

  // 已安装应用状态（不再单独引用 updateAppDetails，因为 fetchInstalledApps 内部已调用）
  const { fetchInstalledApps } = useInstalledAppsStore()

  // 安装队列状态
  const { checkRecovery } = useInstallQueueStore()

  // 应用更新检测（已安装应用的更新）
  const checkAppUpdates = useUpdatesStore.getState().checkUpdates

  // 更新检测状态
  const { checking: checkingUpdate, hasUpdate, updateInfo, checkForUpdate } = useUpdateStore()
  // 环境检测
  const { checkEnv } = useLinglongEnv()

  // ==================== 初始化步骤 ====================

  const getAppVersion = useCallback(async() => {
    try {
      const version = await app.getVersion()
      setAppVersion(version)
      return version
    } catch (err) {
      throw new Error(`获取应用版本失败: ${err}`)
    }
  }, [])

  /**
   * 步骤1: 获取系统架构信息
   */
  const initSystemInfo = useCallback(async() => {
    try {
      const currentArch = arch()
      setArch(currentArch)
    } catch (err) {
      throw new Error(`获取系统架构失败: ${err}`)
    }
  }, [setArch])

  /**
   * 步骤2: 加载已安装应用列表（内部已包含详情补全）
   */
  const loadInstalledApps = useCallback(async() => {
    try {
      await fetchInstalledApps(showBaseService)
    } catch (err) {
      throw new Error(`加载已安装应用失败: ${err}`)
    }
  }, [fetchInstalledApps, showBaseService])

  /**
   * 步骤3: 检查商店版本更新
   */
  const checkStoreVersion = useCallback(async(version: string) => {
    try {
      if (!checkVersion) {
        return
      }

      // 容器内不检查更新（文件系统只读，无法更新）
      if (isContainer) {
        console.info('[launch] 容器内运行，跳过商店版本检查')
        return
      }

      console.info('检查商店版本更新，当前版本:', version)

      // 静默检查更新（不显示提示）
      await checkForUpdate(version, false)
    } catch (err) {
      // 版本检查失败不阻断初始化
      console.warn('检查商店版本失败:', err)
    }
  }, [checkVersion, checkForUpdate, isContainer])

  /**
   * 步骤4: 恢复中断的安装任务
   * 检查上次启动时是否有未完成的安装任务
   * 注意：使用 getState() 获取最新的 store 快照，避免闭包捕获旧值
   */
  const recoverInstallTask = useCallback(() => {
    try {
      console.info('[launch] Checking for interrupted install task...')
      // 使用 getState() 获取最新的已安装应用列表，避免使用可能过时的 React 状态快照
      const latestInstalledApps = useInstalledAppsStore.getState().installedApps
      checkRecovery(latestInstalledApps)
    } catch (err) {
      // 恢复检查失败不阻断初始化
      console.warn('恢复安装任务检查失败:', err)
    }
  }, [checkRecovery])

  /**
   * 执行完整的初始化流程
   */
  const initialize = useCallback(async() => {
    try {
      setError(null)
      setProgress(0)
      console.info('[launch] initialize start')

      // Phase 1: 检查玲珑环境（阻塞门禁，必须先通过）
      setCurrentStep('检测玲珑环境')
      const envResult = await checkEnv()
      setProgress(20)
      if (!envResult.ok) {
        setError(envResult.reason || '检测到玲珑环境缺失或版本过低，请先安装')
        console.warn('[launch] env check failed', envResult.reason)
        return
      }
      console.info('[launch] env ready')

      // Phase 2: 获取版本 + 系统信息（互相独立，并行执行）
      setCurrentStep('获取系统信息')
      const [version] = await Promise.all([
        getAppVersion(),
        initSystemInfo(),
      ])
      setProgress(40)

      // Phase 3: 加载已安装应用 + 检查商店版本 + 初始化统计（互相独立，并行执行）
      setCurrentStep('加载应用数据')
      await Promise.all([
        loadInstalledApps(),
        checkStoreVersion(version),
        initAnalytics(),
      ])
      setProgress(90)

      // 异步检查已安装应用的更新（不阻塞启动，依赖 installedApps store 已填充）
      checkAppUpdates().catch((err) => console.warn('[launch] checkAppUpdates failed', err))

      // Phase 4: 恢复中断的安装任务（依赖已安装列表已加载）
      setCurrentStep('检查安装任务')
      recoverInstallTask()
      setProgress(100)

      onInited()
      setIsInit(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      console.error('应用初始化失败:', err)
    }
  }, [
    getAppVersion,
    initSystemInfo,
    loadInstalledApps,
    checkStoreVersion,
    recoverInstallTask,
    onInited,
    checkAppUpdates,
  ])

  /**
   * 重试初始化
   */
  const retry = useCallback(async() => {
    setIsInit(false)
    setError(null)
    // 环境状态由 global store 统一管理，无需本地重置
    await initialize()
  }, [initialize])

  // ==================== 生命周期 ====================

  /**
   * 组件挂载时执行初始化
   * 使用 ref 守卫防止 StrictMode 下的重复调用
   */
  const initRef = useRef(false)
  useEffect(() => {
    if (initRef.current) {
      return
    }
    initRef.current = true
    initialize()
  }, []) // 只在首次挂载时执行

  // ==================== 返回值 ====================

  return {
    isInit,
    envReady,
    envChecked,
    progress,
    currentStep,
    error,
    retry,
    // 更新检测相关
    checkingUpdate,
    hasUpdate,
    updateInfo,
  }
}
