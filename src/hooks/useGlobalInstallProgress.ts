/**
 * 全局安装进度监听 Hook
 * 监听所有应用的安装进度事件，并更新到安装队列 Store 中
 *
 * 支持新的事件类型：
 * - eventType: "progress" | "error" | "message"
 * - 错误事件包含 code 和 errorDetail 字段
 *
 * 注意：此 Hook 应该在应用根组件中调用一次，确保全局监听
 */
import { useEffect } from 'react'
import { message } from 'antd'
import { onInstallProgress } from '@/apis/invoke'
import { useInstallQueueStore } from '@/stores/installQueue'
import { useShallow } from 'zustand/react/shallow'
import { sendInstallRecord } from '@/services/analyticsService'
import { syncAfterAppChange } from '@/utils/appChangeSync'
import { getInstallErrorMessage, InstallErrorCode } from '@/constants/installErrorCodes'

export const useGlobalInstallProgress = () => {
  const { updateProgress, markSuccess, markFailed } = useInstallQueueStore(
    useShallow((state) => ({
      updateProgress: state.updateProgress,
      markSuccess: state.markSuccess,
      markFailed: state.markFailed,
    })),
  )
  const [messageApi] = message.useMessage()


  useEffect(() => {
    let unlistenProgress: (() => void) | null = null

    const setupListener = async() => {
      // 监听安装进度
      unlistenProgress = await onInstallProgress((progress) => {
        console.info('[useGlobalInstallProgress] Progress received:', progress)

        // 使用 getState() 获取最新值，避免闭包陷阱
        const task = useInstallQueueStore.getState().currentTask
        const appName = task?.appInfo?.zhName || task?.appInfo?.name || progress.appId

        // 根据事件类型处理
        switch (progress.eventType) {
        case 'progress': {
          // 更新队列中对应任务的进度
          updateProgress(progress.appId, progress.percentage, progress.status)

          // 检查是否安装完成（百分比达到 100）
          if (progress.percentage >= 100) {
            console.info(`[useGlobalInstallProgress] Install completed for: ${progress.appId}`)

            // 标记任务成功
            markSuccess(progress.appId)

            // 显示成功消息
            messageApi.success({
              content: `${appName} 安装成功！`,
              key: `install-success-${progress.appId}`,
            })

            // 发送安装统计记录（异步，不阻塞主流程）
            if (task?.appInfo) {
              const appInfo = task.appInfo
              sendInstallRecord({
                appId: appInfo.appId,
                name: appInfo.name,
                version: task.version || appInfo.version,
                arch: appInfo.arch,
                module: appInfo.module,
                channel: appInfo.channel,
              }).catch((err) => console.warn('[useGlobalInstallProgress] sendInstallRecord failed:', err))
            }

            // 后台刷新已安装列表和更新列表
            syncAfterAppChange()
          }
          break
        }

        case 'error': {
          // 错误事件
          const errorCode = progress.code
          const errorMessage = getInstallErrorMessage(errorCode, progress.status)
          const errorDetail = progress.errorDetail || progress.message

          console.error(
            `[useGlobalInstallProgress] Install error for: ${progress.appId}`,
            `code=${errorCode}`,
            `message=${errorMessage}`,
            `detail=${errorDetail}`,
          )

          // 标记任务失败，传入错误码和详情
          markFailed(progress.appId, errorMessage, errorCode, errorDetail)

          // 根据错误码类型显示不同的消息
          if (errorCode === InstallErrorCode.Cancelled) {
            // 取消操作使用 info 级别
            messageApi.info({
              content: `${appName} 安装已取消`,
              key: `install-cancelled-${progress.appId}`,
            })
          } else {
            // 其他错误使用 error 级别
            messageApi.error({
              content: `${appName} ${errorMessage}`,
              key: `install-failed-${progress.appId}`,
            })
          }
          break
        }

        case 'message': {
          // 消息事件仅更新状态文本，不改变进度或结果
          updateProgress(progress.appId, progress.percentage, progress.status)
          break
        }

        default: {
          // 兼容旧格式（没有 eventType 的情况）
          // 根据 progress 字段判断是否是错误
          updateProgress(progress.appId, progress.percentage, progress.status)

          // 检查是否安装完成
          if (progress.percentage >= 100 || progress.status.includes('安装完成')) {
            markSuccess(progress.appId)
            messageApi.success({
              content: `${appName} 安装成功！`,
              key: `install-success-${progress.appId}`,
            })

            // 后台刷新已安装列表和更新列表
            syncAfterAppChange()
          }

          // 检查是否安装失败
          if (progress.status.includes('失败')) {
            markFailed(progress.appId, progress.status)
            messageApi.error({
              content: `${appName} ${progress.status}`,
              key: `install-failed-${progress.appId}`,
            })
          }

          // 检查是否安装取消（旧格式兼容，使用 info 级别提示）
          if (progress.status.includes('取消')) {
            markFailed(progress.appId, progress.status)
            messageApi.info({
              content: `${appName} 安装已取消`,
              key: `install-cancelled-${progress.appId}`,
            })
          }
          break
        }
        }
      })

      console.info('[useGlobalInstallProgress] Listener setup complete')
    }

    setupListener()

    // 组件卸载时清理监听器
    return () => {
      if (unlistenProgress) {
        console.info('[useGlobalInstallProgress] Cleaning up listener')
        unlistenProgress()
      }
    }
  }, [updateProgress, markSuccess, markFailed])
}

