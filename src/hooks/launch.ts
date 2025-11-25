/**
 * 应用启动初始化 Hook
 * 负责应用商店启动时的初始化工作，包括：
 * - 获取系统架构信息
 * - 加载已安装应用列表
 * - 检查应用更新信息
 * - 初始化配置
 */

import { useState, useEffect, useCallback } from 'react'
import { arch } from '@tauri-apps/api/os'
import { useGlobalStore } from '@/stores/global'
import { useConfigStore } from '@/stores/appConfig'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { useUpdateStore } from './useUploadStore'
import { getVersion } from '@tauri-apps/api/app'

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

  // ==================== Store 状态和方法 ====================
  // 全局状态
  const { onInited, setArch, setAppVersion } = useGlobalStore()

  // 配置状态
  const { showBaseService, checkVersion } = useConfigStore()

  // 已安装应用状态
  const { fetchInstalledApps, updateAppDetails } = useInstalledAppsStore()

  // 更新检测状态
  const { checking: checkingUpdate, hasUpdate, updateInfo, checkForUpdate } = useUpdateStore()

  // ==================== 初始化步骤 ====================

  const getAppVersion = useCallback(async() => {
    try {
      const version = await getVersion()
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
      const currentArch = await arch()
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
   * 执行完整的初始化流程
   */
  const initialize = useCallback(async() => {
    try {
      setError(null)
      setProgress(0)

      // 步骤1: 获取应用版本
      setCurrentStep('获取应用版本')
      const version = await getAppVersion()
      setProgress(10)

      // 步骤2: 获取系统信息
      setCurrentStep('获取系统信息')
      await initSystemInfo()
      setProgress(20)

      // 步骤3: 加载已安装应用
      setCurrentStep('加载已安装应用')
      await loadInstalledApps()
      setProgress(50)

      // 步骤4: 加载已安装应用详情
      setCurrentStep('加载已安装应用详情')
      await loadInstalledAppsDetail()
      setProgress(80)

      // 步骤5: 检查商店版本（可选）
      setCurrentStep('检查商店版本')
      await checkStoreVersion(version)
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
    onInited,
  ])

  /**
   * 重试初始化
   */
  const retry = useCallback(async() => {
    setIsInit(false)
    setError(null)
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
