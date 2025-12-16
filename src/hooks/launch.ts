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

import { useState, useEffect, useCallback } from 'react'
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
  /** 环境检测状态 */
  const [envReady, setEnvReady] = useState(false)
  const [envChecked, setEnvChecked] = useState(false)
  /** 当前步骤 */
  const [currentStep, setCurrentStep] = useState<string>('初始化应用')

  // ==================== Store 状态和方法 ====================
  // 全局状态
  const { onInited, setArch, setAppVersion } = useGlobalStore()

  // 配置状态
  const { showBaseService, checkVersion } = useConfigStore()

  // 已安装应用状态
  const { fetchInstalledApps, updateAppDetails, installedApps } = useInstalledAppsStore()

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
   * 步骤2: 加载已安装应用列表
   */
  const loadInstalledApps = useCallback(async() => {
    try {
      await fetchInstalledApps(showBaseService)
    } catch (err) {
      throw new Error(`加载已安装应用失败: ${err}`)
    }
  }, [fetchInstalledApps, showBaseService])

  /**
   * 步骤3: 加载已安装应用信息
   */
  const loadInstalledAppsDetail = useCallback(async() => {
    try {
      await updateAppDetails()
    } catch (err) {
      throw new Error(`获取已安装应用信息: ${err}`)
    }
  }, [updateAppDetails])

  /**
   * 步骤4: 检查商店版本更新
   */
  const checkStoreVersion = useCallback(async(version: string) => {
    try {
      if (!checkVersion) {
        return
      }

      console.info('检查商店版本更新，当前版本:', version)

      // 静默检查更新（不显示提示）
      await checkForUpdate(version, false)
    } catch (err) {
      // 版本检查失败不阻断初始化
      console.warn('检查商店版本失败:', err)
    }
  }, [checkVersion, checkForUpdate])

  /**
   * 步骤5: 恢复中断的安装任务
   * 检查上次启动时是否有未完成的安装任务
   */
  const recoverInstallTask = useCallback((apps: API.INVOKE.InstalledApp[]) => {
    try {
      console.info('[launch] Checking for interrupted install task...')
      checkRecovery(apps)
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

      // 步骤1: 检查玲珑环境
      setCurrentStep('检测玲珑环境')
      const envResult = await checkEnv()
      setProgress(20)
      if (!envResult.ok) {
        setError(envResult.reason || '检测到玲珑环境缺失或版本过低，请先安装')
        setEnvReady(false)
        setEnvChecked(true)
        console.warn('[launch] env check failed', envResult.reason)
        return
      }
      setEnvReady(true)
      setEnvChecked(true)
      console.info('[launch] env ready')

      // 步骤2: 获取应用版本
      setCurrentStep('获取应用版本')
      const version = await getAppVersion()
      setProgress(30)

      // 步骤3: 获取系统信息
      setCurrentStep('获取系统信息')
      await initSystemInfo()
      setProgress(40)

      // 异步检查已安装应用的更新（不阻塞启动）
      checkAppUpdates().catch((err) => console.warn('[launch] checkAppUpdates failed', err))

      // 步骤4: 加载已安装应用
      setCurrentStep('加载已安装应用')
      await loadInstalledApps()
      setProgress(55)

      // 步骤5: 加载已安装应用详情
      setCurrentStep('加载已安装应用详情')
      await loadInstalledAppsDetail()
      setProgress(80)

      // 步骤6: 检查商店版本（可选）
      setCurrentStep('检查商店版本')
      await checkStoreVersion(version)
      setProgress(90)

      // 步骤7: 恢复中断的安装任务
      setCurrentStep('检查安装任务')
      recoverInstallTask(installedApps)
      setProgress(95)

      // 步骤8: 初始化匿名统计（获取设备指纹和IP）
      setCurrentStep('初始化服务')
      await initAnalytics()
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
    loadInstalledAppsDetail,
    checkStoreVersion,
    recoverInstallTask,
    installedApps,
    onInited,
    checkAppUpdates,
  ])

  /**
   * 重试初始化
   */
  const retry = useCallback(async() => {
    setIsInit(false)
    setError(null)
    setEnvReady(false)
    setEnvChecked(false)
    await initialize()
  }, [initialize])

  // ==================== 生命周期 ====================

  /**
   * 组件挂载时执行初始化
   */
  useEffect(() => {
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
