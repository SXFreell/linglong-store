import { Spin, Empty, Button, message } from 'antd'
import { useCallback, useMemo } from 'react'
import { ReloadOutlined } from '@ant-design/icons'
import styles from './index.module.scss'
import ConnectedApplicationCard from '@/components/ConnectedApplicationCard'
import { useCheckUpdates } from '@/hooks/useCheckUpdates'
import { useAppInstall } from '@/hooks/useAppInstall'
import { useInstallQueueStore } from '@/stores/installQueue'
import { useShallow } from 'zustand/react/shallow'

// ==================== 组件 ====================

const UpdateApp = () => {
  const { loading: checking, updates, checkUpdates } = useCheckUpdates()
  const { handleBatchInstall, isAppInQueue } = useAppInstall()
  const { queue, currentTask, isProcessing } = useInstallQueueStore(
    useShallow((state) => ({ queue: state.queue, currentTask: state.currentTask, isProcessing: state.isProcessing })),
  )

  // 获取正在安装/队列中的应用ID集合
  const installingAppIds = useMemo(() => {
    const ids = new Set<string>()

    // 当前正在安装的
    if (currentTask?.appId) {
      ids.add(currentTask.appId)
    }

    // 队列中等待的
    queue.forEach((task) => {
      if (task.appId) {
        ids.add(task.appId)
      }
    })

    return ids
  }, [currentTask, queue])

  /**
   * 一键更新所有应用
   * 批量加入安装队列，串行执行
   */
  const handleUpdateAll = useCallback(() => {
    if (updates.length === 0) {
      return
    }

    // 过滤掉已在队列中的应用
    const appsToUpdate = updates.filter((app) => app.appId && !isAppInQueue(app.appId))

    if (appsToUpdate.length === 0) {
      message.warning('所有应用都已在更新队列中')
      return
    }

    // 构建批量安装任务
    const tasks = appsToUpdate.map((app) => ({
      appInfo: app,
      version: app.version,
      force: false,
    }))

    // 批量入队
    handleBatchInstall(tasks)
  }, [updates, isAppInQueue, handleBatchInstall])

  /**
   * 手动检查更新
   */
  const handleCheckUpdates = useCallback(() => {
    checkUpdates(true)
  }, [checkUpdates])

  // 是否禁用一键更新按钮
  const isUpdateAllDisabled = isProcessing || installingAppIds.size > 0 || updates.length === 0

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <p className={styles.updateAppTitle}>更新应用</p>
        <Button
          type="text"
          icon={<ReloadOutlined spin={checking} />}
          onClick={handleCheckUpdates}
          disabled={checking}
        >
          检查更新
        </Button>
      </div>

      <Spin spinning={checking && updates.length === 0} tip="正在检查更新...">
        {updates.length > 0 ? (
          <>
            <div className={styles.updateApplicationList}>
              {updates.map((app) => (
                <div key={app.appId} className={styles.cardWrapper}>
                  <ConnectedApplicationCard
                    operateId={4}
                    appInfo={app}
                  />
                </div>
              ))}
            </div>

            <div className={styles.floatingBtnContainer}>
              <Button
                type="primary"
                size="large"
                shape="round"
                onClick={handleUpdateAll}
                loading={isProcessing}
                disabled={isUpdateAllDisabled}
              >
                一键更新 ({updates.length})
              </Button>
            </div>
          </>
        ) : (
          !checking && (
            <div className={styles.emptyContainer}>
              <Empty description="暂无需更新应用" image={null} />
            </div>
          )
        )}
      </Spin>
    </div>
  )
}

export default UpdateApp
