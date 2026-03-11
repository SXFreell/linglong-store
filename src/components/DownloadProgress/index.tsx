/**
 * 下载进度组件
 * 显示安装队列中的任务状态和进度
 */
import styles from './index.module.scss'
import { useMemo, memo, useCallback } from 'react'
import DefaultIcon from '@/assets/linyaps.svg?url'
import { Progress, Empty, message } from 'antd'
import { useInstallQueueStore } from '@/stores/installQueue'
import { useShallow } from 'zustand/react/shallow'
import { runApp, cancelInstall } from '@/apis/invoke'
import SpeedTool from '@/components/speedTool'
/**
 * 任务进度图标组件
 * 使用 React.memo 包装以避免不必要的重渲染
 * [性能优化] 该组件接收的 props 变化时才重新渲染
 */
const TaskProgressIcon = memo(({
  percentage = 0,
  status,
}: {
  percentage?: number
  status: Store.InstallTaskStatus
}) => {
  // 根据状态确定进度条状态
  const progressStatus = useMemo(() => {
    switch (status) {
    case 'success':
      return 'success'
    case 'failed':
      return 'exception'
    case 'installing':
      return 'active'
    default:
      return 'normal'
    }
  }, [status])

  return (
    <div className={styles.downloadIcon}>
      <Progress
        percent={Number(percentage)}
        size={32}
        type="circle"
        status={progressStatus}
        strokeWidth={6}
        format={(percent) => `${Math.round(percent || 0)}%`}
      />
    </div>
  )
})

// [ESLint规范] 添加 displayName 便于调试时识别组件
// [ESLint规范] 添加 displayName 便于调试时识别组件
TaskProgressIcon.displayName = 'TaskProgressIcon'

const DownloadProgress = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const { currentTask, queue, history, clearHistory, removeFromQueue } = useInstallQueueStore(
    useShallow((state) => ({
      currentTask: state.currentTask,
      queue: state.queue,
      history: state.history,
      clearHistory: state.clearHistory,
      removeFromQueue: state.removeFromQueue,
    })),
  )

  // 合并所有任务列表用于显示
  const allTasks = useMemo(() => {
    const tasks: Store.InstallTask[] = []

    // 当前正在执行的任务
    if (currentTask) {
      tasks.push(currentTask)
    }

    // 队列中等待的任务
    tasks.push(...queue)

    // 历史记录（最近完成的）
    tasks.push(...history.slice(0, 10)) // 只显示最近 10 条历史

    return tasks
  }, [currentTask, queue, history])

  /**
   * 清除已完成的历史记录
   */
  const cleanDownloadHistory = useCallback(() => {
    if (history.length === 0) {
      messageApi.info('暂无已完成的下载记录!')
      return
    }

    clearHistory()
    messageApi.success(`已清除 ${history.length} 条下载记录`)
  }, [history.length, clearHistory, messageApi])

  /**
   * 启动应用
   */
  const handleOpenApp = useCallback(async(appId?: string) => {
    if (!appId) {
      messageApi.error('无法启动：缺少应用ID')
      return
    }

    try {
      await runApp(appId)
      messageApi.success('应用启动成功')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      messageApi.error(`启动失败: ${errorMessage}`)
    }
  }, [messageApi])

  /**
   * 从队列中移除待安装的任务
   */
  const handleRemoveFromQueue = useCallback((taskId: string) => {
    removeFromQueue(taskId)
  }, [removeFromQueue])

  /**
   * 取消正在进行的安装
   */
  const handleCancelInstall = useCallback(async(task: Store.InstallTask) => {
    try {
      await cancelInstall(task.appId)
      removeFromQueue(task.id)
      messageApi.success('取消安装成功')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      messageApi.error(`取消失败: ${errorMessage}`)
    }
  }, [removeFromQueue, messageApi])

  /**
   * 渲染任务状态文本
   */
  const renderStatusText = (task: Store.InstallTask) => {
    switch (task.status) {
    case 'pending':
      return '等待中'
    case 'installing':
      return `${task.message} ${task.progress}%`
    case 'success':
      return '安装完成'
    case 'failed': {
      // 显示错误信息，如果有详情则一并显示
      const errorMsg = task.error || '未知错误'
      const detail = task.errorDetail && task.errorDetail !== errorMsg ? ` (${task.errorDetail})` : ''
      return `${errorMsg}${detail}`
    }
    default:
      return task.message
    }
  }

  /**
   * 渲染任务操作按钮
   */
  const renderTaskActions = (task: Store.InstallTask) => {
    switch (task.status) {
    case 'pending':
      return (
        <button className={styles.closeBtn} onClick={() => handleRemoveFromQueue(task.id)}>
            ×
        </button>
      )
    case 'installing':
      // 正在安装的任务显示进度和取消按钮
      return (
        <div className={styles.downloadIcon}>
          <TaskProgressIcon percentage={task.progress} status={task.status} />
          <div
            className={styles.cancelDownload}
            onClick={() => handleCancelInstall(task)}
            title="取消安装"
          >
            ×
          </div>
        </div>
      )
    case 'success':
      // 安装成功显示打开按钮
      return (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={styles.downloadBtn} onClick={() => handleOpenApp(task.appId)}>
              打开
          </button>
          <div
            className={styles.cancelDownload}
            onClick={() => handleRemoveFromQueue(task.id)}
            title="移除"
          >
            ×
          </div>
        </div>
      )
    case 'failed':
      // 安装失败显示错误状态
      // return <TaskProgressIcon percentage={0} status={task.status} />
      return (
        <div className={styles.downloadIcon}>
          <TaskProgressIcon percentage={0} status={task.status} />
          <div
            className={styles.cancelDownload}
            onClick={() => handleRemoveFromQueue(task.id)}
            title="移除"
          >
            ×
          </div>
        </div>
      )
    default:
      return null
    }
  }

  return (
    <>
      <div className={styles.downloadContainer}>
        <div className={styles.downloadBox}>
          {allTasks.length > 0 ? (
            allTasks.map((task) => (
              <div className={styles.downloadItem} key={task.id}>
                <div className={styles.itemLeft}>
                  <div className={styles.itemLeft_icon}>
                    <img src={task.appInfo?.icon || DefaultIcon} alt="应用图标" />
                  </div>
                  <div className={styles.itemLeft_content}>
                    <p className={styles.contentName}>
                      {task.appInfo?.zhName || task.appInfo?.name || task.appId || '应用名称'}
                    </p>
                    <p className={styles.contentSize}>{renderStatusText(task)}</p>
                  </div>
                </div>
                <div className={styles.itemRight}>{renderTaskActions(task)}</div>
              </div>
            ))
          ) : (
            <Empty description="暂无安装任务" />
          )}
        </div>
        <div className={styles.speedToolAndDownloadFooter}>
          <SpeedTool />
          {contextHolder}
          {history.length > 0 ? (
            <div className={styles.downloadFooter} onClick={cleanDownloadHistory}>
            清除下载记录
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}

export default DownloadProgress
