/**
 * useLinglongProcesses
 *
 * 封装玲珑进程列表的拉取、智能刷新、失败退避和行级操作状态。
 *
 * 刷新策略：
 * - 仅当 isTabActive=true 且页面可见时自动轮询（默认 3s）
 * - 并发保护：上一轮未完成则跳过本轮
 * - 失败退避：1次失败→3s，2次→6s，3次及以上→10s
 * - 页面恢复可见时立即补刷新
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getRunningLinglongApps, killLinglongApp } from '@/apis/invoke'
import { App } from 'antd'

type RunningApp = API.INVOKE.RunningApp

/** 退避间隔表（连续失败次数 → 下次等待毫秒数） */
const BACKOFF_TABLE: number[] = [3000, 6000, 10000]

function getBackoffMs(failCount: number): number {
  const idx = Math.min(failCount - 1, BACKOFF_TABLE.length - 1)
  return BACKOFF_TABLE[Math.max(0, idx)]
}

export interface UseLinglongProcessesReturn {
  /** 当前运行中的进程列表 */
  processes: RunningApp[]
  /** 首次加载中（列表为空且尚无数据） */
  isInitialLoading: boolean
  /** 静默刷新中（已有数据，后台更新） */
  isRefreshing: boolean
  /** 最近一次成功刷新的时间 */
  lastRefreshedAt: Date | null
  /** 最近一次刷新错误 */
  error: string | null
  /** 正在执行停止操作的行 id 集合（containerId） */
  killLoadingIds: Set<string>
  /** 手动触发刷新 */
  refresh: () => void
  /** 停止指定进程 */
  killProcess: (app: RunningApp) => Promise<void>
}

interface Props {
  /** 当前是否处于"玲珑进程"标签页 */
  isTabActive: boolean
}

export function useLinglongProcesses({ isTabActive }: Props): UseLinglongProcessesReturn {
  const { message } = App.useApp()

  const [processes, setProcesses] = useState<RunningApp[]>([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [killLoadingIds, setKillLoadingIds] = useState<Set<string>>(new Set())

  // 用 ref 跟踪请求状态，避免状态闭包问题
  const isFetchingRef = useRef(false)
  const failCountRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isTabActiveRef = useRef(isTabActive)

  // 同步最新 isTabActive 到 ref
  useEffect(() => {
    isTabActiveRef.current = isTabActive
  }, [isTabActive])

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /** 单次拉取，返回是否成功 */
  const fetchOnce = useCallback(async(silent: boolean): Promise<boolean> => {
    if (isFetchingRef.current) {
      return true // 跳过并发请求
    }
    isFetchingRef.current = true

    if (!silent) {
      setIsInitialLoading(true)
    } else {
      setIsRefreshing(true)
    }

    try {
      const apps = await getRunningLinglongApps()
      setProcesses(apps)
      setLastRefreshedAt(new Date())
      setError(null)
      failCountRef.current = 0
      return true
    } catch (e) {
      const msg = String(e)
      setError(msg)
      failCountRef.current += 1
      return false
    } finally {
      isFetchingRef.current = false
      setIsInitialLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  /** 调度下一次自动刷新 */
  const scheduleNext = useCallback(() => {
    clearTimer()
    const interval = failCountRef.current > 0
      ? getBackoffMs(failCountRef.current)
      : 3000

    timerRef.current = setTimeout(async() => {
      if (!isTabActiveRef.current || document.hidden) {
        // 不满足条件时不执行，但继续调度（等待条件恢复）
        scheduleNext()
        return
      }
      await fetchOnce(true)
      scheduleNext()
    }, interval)
  }, [clearTimer, fetchOnce])

  /** 手动刷新（对外暴露） */
  const refresh = useCallback(() => {
    clearTimer()
    fetchOnce(true).then(() => {
      scheduleNext()
    })
  }, [clearTimer, fetchOnce, scheduleNext])

  /** 页面可见性变化：切回前台时补刷新 */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isTabActiveRef.current) {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refresh])

  /** 标签页激活/切换时控制轮询 */
  useEffect(() => {
    if (isTabActive) {
      // 切换到本 tab：立即拉取并开启轮询
      clearTimer()
      fetchOnce(processes.length > 0).then(() => {
        scheduleNext()
      })
    } else {
      // 离开本 tab：停止轮询
      clearTimer()
    }
    return () => {
      clearTimer()
    }
  }, [isTabActive])

  /** 停止进程 */
  const killProcess = useCallback(async(app: RunningApp) => {
    setKillLoadingIds(prev => new Set(prev).add(app.id))
    try {
      await killLinglongApp(app.name)
      message.success(`已停止 ${app.name}`)
      // 停止成功后立即刷新
      refresh()
    } catch (e) {
      message.error(`停止 ${app.name} 失败：${e}`)
    } finally {
      setKillLoadingIds(prev => {
        const next = new Set(prev)
        next.delete(app.id)
        return next
      })
    }
  }, [message, refresh])

  return {
    processes,
    isInitialLoading,
    isRefreshing,
    lastRefreshedAt,
    error,
    killLoadingIds,
    refresh,
    killProcess,
  }
}
