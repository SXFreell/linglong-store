/**
 * 安装队列状态管理模块
 * 统一管理应用安装队列，支持串行安装、失败隔离
 *
 * 设计原则：
 * 1. 严格串行：同一时间只允许一个安装任务执行
 * 2. 失败隔离：单个任务失败不影响队列中其他任务
 * 3. 部分持久化：只持久化 currentTask，用于应用崩溃恢复
 */
import { create } from 'zustand'
import { installApp } from '@/apis/invoke'

// 本地存储 key
const CURRENT_TASK_STORAGE_KEY = 'linglong-store-current-install-task'
// 历史记录最大保留条数，防止内存无限增长
const MAX_HISTORY_SIZE = 50

/**
 * 生成唯一任务ID
 */
const generateTaskId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 创建安装任务
 */
const createInstallTask = (
  appInfo: API.APP.AppMainDto,
  options?: { version?: string; force?: boolean },
): Store.InstallTask => ({
  id: generateTaskId(),
  appId: appInfo.appId || '',
  appInfo,
  version: options?.version,
  force: options?.force ?? false,
  status: 'pending',
  progress: 0,
  message: '等待安装...',
  createdAt: Date.now(),
})

/**
 * 安装队列 Store
 */
export const useInstallQueueStore = create<Store.InstallQueue>((set, get) => ({
  queue: [],
  currentTask: null,
  history: [],
  isProcessing: false,

  enqueueInstall: (appInfo, options) => {
    const task = createInstallTask(appInfo, options)

    // 检查是否已在队列中或正在安装
    const state = get()
    if (state.isAppInQueue(task.appId)) {
      console.warn(`[InstallQueue] App ${task.appId} is already in queue, skipping`)
      return task.id
    }

    set((state) => ({
      queue: [...state.queue, task],
    }))

    console.info(`[InstallQueue] Enqueued task: ${task.id} for app: ${task.appId}`)

    // 如果当前没有正在处理的任务，开始处理队列
    if (!get().isProcessing && !get().currentTask) {
      // 使用 setTimeout 确保状态更新后再处理
      setTimeout(() => get().processQueue(), 0)
    }

    return task.id
  },

  enqueueBatch: (tasks) => {
    const taskIds: string[] = []
    const state = get()

    const newTasks = tasks
      .filter((t) => !state.isAppInQueue(t.appInfo.appId || ''))
      .map((t) => {
        const task = createInstallTask(t.appInfo, { version: t.version, force: t.force })
        taskIds.push(task.id)
        return task
      })

    if (newTasks.length > 0) {
      set((state) => ({
        queue: [...state.queue, ...newTasks],
      }))

      console.info(`[InstallQueue] Enqueued ${newTasks.length} tasks in batch`)

      // 如果当前没有正在处理的任务，开始处理队列
      if (!get().isProcessing && !get().currentTask) {
        setTimeout(() => get().processQueue(), 0)
      }
    }

    return taskIds
  },

  processQueue: async() => {
    const state = get()

    // 如果已经在处理中，或者队列为空，直接返回
    if (state.isProcessing || state.currentTask) {
      console.info('[InstallQueue] Already processing or has current task, skipping')
      return
    }

    if (state.queue.length === 0) {
      console.info('[InstallQueue] Queue is empty, nothing to process')
      return
    }

    // 取出队列中第一个任务
    const [nextTask, ...remainingQueue] = state.queue

    set({
      isProcessing: true,
      queue: remainingQueue,
      currentTask: {
        ...nextTask,
        status: 'installing',
        message: '准备安装...',
        startedAt: Date.now(),
      },
    })

    // 持久化当前任务
    get().persistCurrentTask()

    console.info(`[InstallQueue] Processing task: ${nextTask.id} for app: ${nextTask.appId}`)

    try {
      // 调用安装接口
      await installApp(nextTask.appId, nextTask.version, nextTask.force)

      // 注意：安装成功的标记由 useGlobalInstallProgress 中的进度监听触发
      // 这里只是发起安装请求，实际完成状态由事件回调处理
      console.info(`[InstallQueue] Install request sent for: ${nextTask.appId}`)
    } catch (error) {
      // 安装请求发送失败（通常是网络问题或参数错误）
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`[InstallQueue] Install request failed for ${nextTask.appId}:`, errorMessage)

      get().markFailed(nextTask.appId, errorMessage)
    }
  },

  updateProgress: (appId, progress, message) => {
    set((state) => {
      if (state.currentTask?.appId !== appId) {
        return state
      }

      const updatedTask = {
        ...state.currentTask,
        progress,
        message,
      }

      return { currentTask: updatedTask }
    })

    // 更新持久化
    get().persistCurrentTask()
  },

  markSuccess: (appId) => {
    const state = get()

    if (state.currentTask?.appId !== appId) {
      console.warn(`[InstallQueue] markSuccess called for ${appId} but current task is ${state.currentTask?.appId}`)
      return
    }

    const completedTask: Store.InstallTask = {
      ...state.currentTask,
      status: 'success',
      progress: 100,
      message: '安装完成',
      finishedAt: Date.now(),
    }

    set((state) => ({
      currentTask: null,
      isProcessing: false,
      history: [completedTask, ...state.history].slice(0, MAX_HISTORY_SIZE),
    }))

    // 清除持久化
    localStorage.removeItem(CURRENT_TASK_STORAGE_KEY)

    console.info(`[InstallQueue] Task completed successfully: ${appId}`)

    // 处理下一个任务
    setTimeout(() => get().processQueue(), 100)
  },

  markFailed: (appId, error, errorCode, errorDetail) => {
    const state = get()

    if (state.currentTask?.appId !== appId) {
      console.warn(`[InstallQueue] markFailed called for ${appId} but current task is ${state.currentTask?.appId}`)
      return
    }

    const failedTask: Store.InstallTask = {
      ...state.currentTask,
      status: 'failed',
      message: error || '安装失败',
      error,
      errorCode,
      errorDetail,
      finishedAt: Date.now(),
    }

    set((state) => ({
      currentTask: null,
      isProcessing: false,
      history: [failedTask, ...state.history].slice(0, MAX_HISTORY_SIZE),
    }))

    // 清除持久化
    localStorage.removeItem(CURRENT_TASK_STORAGE_KEY)

    console.error(`[InstallQueue] Task failed: ${appId}, error: ${error}, code: ${errorCode}`)

    // 继续处理下一个任务（失败不阻塞队列）
    setTimeout(() => get().processQueue(), 100)
  },

  clearHistory: () => {
    set({ history: [] })
  },

  clearQueue: () => {
    set({ queue: [] })
    console.info('[InstallQueue] Queue cleared')
  },

  hasActiveTasks: () => {
    const state = get()
    return state.currentTask !== null || state.queue.length > 0
  },

  removeFromQueue: (taskId) => {
    set((state) => ({
      queue: state.queue.filter((t) => t.id !== taskId),
      history: state.history.filter((t) => t.id !== taskId),
    }))
  },

  isAppInQueue: (appId) => {
    const state = get()

    // 检查当前任务
    if (state.currentTask?.appId === appId) {
      return true
    }

    // 检查待处理队列
    if (state.queue.some((t) => t.appId === appId)) {
      return true
    }

    return false
  },

  getAppInstallStatus: (appId) => {
    const state = get()

    // 优先返回当前任务
    if (state.currentTask?.appId === appId) {
      return state.currentTask
    }

    // 检查队列中的任务
    const queuedTask = state.queue.find((t) => t.appId === appId)
    if (queuedTask) {
      return queuedTask
    }

    // 检查历史记录
    const historyTask = state.history.find((t) => t.appId === appId)
    if (historyTask) {
      return historyTask
    }

    return null
  },

  checkRecovery: (installedApps) => {
    const persistedTask = get().loadPersistedTask()

    if (!persistedTask) {
      console.info('[InstallQueue] No persisted task to recover')
      return
    }

    console.info(`[InstallQueue] Recovering task for app: ${persistedTask.appId}`)

    // 检查应用是否已安装
    const isInstalled = installedApps.some((app) => {
      // 如果指定了版本，需要匹配版本
      if (persistedTask.version) {
        return app.appId === persistedTask.appId && app.version === persistedTask.version
      }
      // 否则只匹配 appId
      return app.appId === persistedTask.appId
    })

    if (isInstalled) {
      // 应用已安装，标记为成功
      console.info(`[InstallQueue] App ${persistedTask.appId} is installed, marking as success`)

      const successTask: Store.InstallTask = {
        ...persistedTask,
        status: 'success',
        progress: 100,
        message: '安装完成',
        finishedAt: Date.now(),
      }

      set((state) => ({
        history: [successTask, ...state.history].slice(0, MAX_HISTORY_SIZE),
      }))
    } else {
      // 应用未安装，标记为失败
      console.info(`[InstallQueue] App ${persistedTask.appId} is not installed, marking as failed`)

      const failedTask: Store.InstallTask = {
        ...persistedTask,
        status: 'failed',
        message: '安装失败（应用异常退出）',
        error: '安装过程中应用异常退出，请重新安装',
        finishedAt: Date.now(),
      }

      set((state) => ({
        history: [failedTask, ...state.history].slice(0, MAX_HISTORY_SIZE),
      }))
    }

    // 清除持久化
    localStorage.removeItem(CURRENT_TASK_STORAGE_KEY)
  },

  persistCurrentTask: () => {
    const state = get()

    if (state.currentTask) {
      try {
        localStorage.setItem(CURRENT_TASK_STORAGE_KEY, JSON.stringify(state.currentTask))
      } catch (error) {
        console.error('[InstallQueue] Failed to persist current task:', error)
      }
    }
  },

  loadPersistedTask: () => {
    try {
      const stored = localStorage.getItem(CURRENT_TASK_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as Store.InstallTask
      }
    } catch (error) {
      console.error('[InstallQueue] Failed to load persisted task:', error)
      // [错误恢复] 清理损坏的 localStorage 数据，避免下次启动时反复解析失败
      localStorage.removeItem(CURRENT_TASK_STORAGE_KEY)
    }
    return null
  },
}))
