/**
 * 应用启动初始化 Hook
 * 负责应用商店启动时的初始化工作，包括：
 * - 获取系统架构信息
 * - 加载已安装应用列表
 * - 检查应用更新信息
 * - 初始化配置
 */

import { useState, useEffect, useCallback } from 'react'
import { arch } from '@tauri-apps/plugin-os'
import { useGlobalStore } from '@/stores/global'
import { useConfigStore } from '@/stores/appConfig'
import { useInstalledAppsStore } from '@/stores/installedApps'

interface UseLaunchReturn {
  /** 初始化状态标识 */
  isInit: boolean
  /** 初始化进度（0-100） */
  progress: number
  /** 初始化错误信息 */
  error: string | null
  /** 重新初始化方法 */
  retry: () => void
}

/**
 * 应用启动初始化 Hook
 * @returns {UseLaunchReturn} 初始化状态和控制方法
 */
export const useLaunch = (): UseLaunchReturn => {
  // ==================== 状态管理 ====================
  /** 初始化完成标识 */
  const [isInit, setIsInit] = useState(false)
  /** 初始化进度 */
  const [progress, setProgress] = useState(0)
  /** 错误信息 */
  const [error, setError] = useState<string | null>(null)

  // ==================== Store 状态和方法 ====================
  // 全局状态
  const { onInited, setArch, getUpdateAppNum } = useGlobalStore()

  // 配置状态
  const { showBaseService, checkVersion } = useConfigStore()

  // 已安装应用状态
  const {
    fetchInstalledApps,
    needUpdateApps,
  } = useInstalledAppsStore()

  // ==================== 初始化步骤 ====================

  /**
   * 步骤1: 获取系统架构信息
   */
  const initSystemInfo = useCallback(async() => {
    try {
      const currentArch = arch()
      setArch(currentArch)
      setProgress(25)
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
      setProgress(50)
    } catch (err) {
      throw new Error(`加载已安装应用失败: ${err}`)
    }
  }, [fetchInstalledApps, showBaseService])

  /**
   * 步骤3: 检查应用更新
   */
  const checkAppUpdates = useCallback(async() => {
    try {
      // TODO: 实现检查更新逻辑
      // 1. 对比已安装应用和服务器版本
      // 2. 筛选出需要更新的应用
      // 3. 更新 needUpdateApps 列表

      const updateCount = needUpdateApps.length
      getUpdateAppNum(updateCount)
      setProgress(75)
    } catch (err) {
      // 更新检查失败不阻止初始化
      console.warn('检查应用更新失败:', err)
      setProgress(75)
    }
  }, [needUpdateApps, getUpdateAppNum])

  /**
   * 步骤4: 检查商店版本更新
   */
  const checkStoreVersion = useCallback(async() => {
    try {
      if (!checkVersion) {
        setProgress(90)
        return
      }

      // TODO: 实现商店版本检查逻辑
      // 1. 获取当前商店版本
      // 2. 请求服务器最新版本
      // 3. 对比版本号
      // 4. 显示更新提示（如果需要）

      setProgress(90)
    } catch (err) {
      // 版本检查失败不阻止初始化
      console.warn('检查商店版本失败:', err)
      setProgress(90)
    }
  }, [checkVersion])

  /**
   * 执行完整的初始化流程
   */
  const initialize = useCallback(async() => {
    try {
      setError(null)
      setProgress(0)

      // 步骤1: 获取系统信息
      await initSystemInfo()

      // 步骤2: 加载已安装应用
      await loadInstalledApps()

      // 步骤3: 检查应用更新
      await checkAppUpdates()

      // 步骤4: 检查商店版本（可选）
      await checkStoreVersion()

      // 完成初始化
      setProgress(100)
      onInited()
      setIsInit(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      console.error('应用初始化失败:', err)
    }
  }, [
    initSystemInfo,
    loadInstalledApps,
    checkAppUpdates,
    checkStoreVersion,
    onInited,
  ])

  /**
   * 重试初始化
   */
  const retry = useCallback(() => {
    setIsInit(false)
    setError(null)
    initialize()
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
    error,
    retry,
  }
}
