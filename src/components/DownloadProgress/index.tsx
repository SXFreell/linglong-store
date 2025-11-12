import styles from './index.module.scss'
import { useMemo } from 'react'
import DefaultIcon from '@/assets/linyaps.svg?url'
import { Progress, Empty, message } from 'antd'
import { useDownloadConfigStore } from '@/stores/appConfig'
import { cancelInstallApp } from '@/apis/invoke'

const DownloadIcon = ({ appId, percentage = 0, isDownloading = false }: {
  appId: string
  percentage?: number
  isDownloading?: boolean
}) => {
  const {
    removeDownloadingApp,
  } = useDownloadConfigStore()

  const handleCancel = async() => {
    console.log('[handleCancel] Clicked! appId:', appId, 'isDownloading:', isDownloading)

    if (isDownloading) {
      try {
        console.log('[handleCancel] Calling cancelInstallApp for:', appId)
        const result = await cancelInstallApp(appId)
        console.log('[handleCancel] Cancel result:', result)
        message.success('已取消安装')
        removeDownloadingApp(appId)
        console.info('[handleCancel] Successfully cancelled:', appId)
      } catch (error) {
        console.error('[handleCancel] Cancel failed:', error)
        message.error(`取消安装失败: ${error}`)
      }
    } else {
      // 已完成的任务直接删除
      removeDownloadingApp(appId)
      console.info('[handleCancel] Removed completed task:', appId)
    }
  }

  // 调试日志
  console.log(`[DownloadIcon] appId: ${appId}, percentage: ${percentage}, type: ${typeof percentage}`)

  return (
    <div className={styles.downloadIcon}>
      <span className={styles.cancelDownload} onClick={handleCancel}>
        ×
      </span>
      <Progress
        percent={Number(percentage)}
        width={32}
        type='circle'
        status={percentage >= 100 ? 'success' : 'active'}
        strokeWidth={6}
        format={(percent) => `${Math.round(percent || 0)}%`}
      />
    </div>
  )
}
const DownloadProgress = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const {
    downloadList,
    clearDownloadList,
    removeDownloadingApp,
  } = useDownloadConfigStore()
  // 获取图标 URL
  const iconUrl = useMemo(() => {
    return DefaultIcon
  }, [])

  const cleanDownloadHistory = () => {
    if (downloadList.length === 0) {
      messageApi.info('暂无下载记录!')
      return
    }
    clearDownloadList()
  }
  return <>
    <div className={styles.downloadContainer}>
      <div className={styles.downloadBox} >
        {downloadList.length > 0 ? downloadList.map((item)=>{
          return <div className={styles.downloadItem} key={item.appId}>
            <div className={styles.itemLeft}>
              <div className={styles.itemLeft_icon}><img src={item.icon || iconUrl} alt={'应用图标'} /></div>
              <div className={styles.itemLeft_content}>
                <p className={styles.contentName}>
                  {item.zhName || item.name || '应用名称' }
                </p>
                <p className={styles.contentSize}>
                  {item.flag === 'downloading'
                    ? `${item.installStatus || '准备中'} ${item.percentage || 0}%`
                    : item.size || '未知大小'
                  }
                </p>
              </div>
            </div>
            <div className={styles.itemRight}>
              {
                item.flag === 'downloading'
                  ? <DownloadIcon
                    appId={item.appId || ''}
                    percentage={item.percentage || 0}
                    isDownloading={true}
                  />
                  : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={styles.downloadBtn}>打开</button>
                      <button
                        className={styles.closeBtn}
                        onClick={() => removeDownloadingApp(item.appId || '')}
                      >
                        ×
                      </button>
                    </div>
                  )
              }
            </div>
          </div>
        }) : (
          <Empty description="暂无下载任务" />
        )}
      </div>
      {contextHolder}
      {downloadList.length > 0 ? <div className={styles.downloadFooter} onClick={cleanDownloadHistory}>清除下载记录</div> : null}
    </div>
  </>
}
export default DownloadProgress


