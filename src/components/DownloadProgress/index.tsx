import styles from './index.module.scss'
import { useState, useEffect, useMemo } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'
import { Progress, Empty, message } from 'antd'
import { useDownloadConfigStore } from '@/stores/appConfig'
const DownloadIcon = ({ appId = '123' })=>{
  const [percent, setPercent] = useState(0)
  const {
    removeDownloadingApp,
  } = useDownloadConfigStore()
  // 假进度：从 0 逐步增加到 99，模拟下载进度
  useEffect(() => {
    setPercent(0)
    const timer = setInterval(() => {
      setPercent((p) => {
        if (p >= 97) {
          clearInterval(timer)
          return 97
        }
        // 每次增加 1-6 的随机步进，使动画更自然
        const step = Math.floor(Math.random() * 5)
        return Math.min(97, p + step)
      })
    }, 800)

    return () => clearInterval(timer)
  }, [appId])
  const handleDelete = ()=>{
    removeDownloadingApp(appId)
    console.info(appId, '删除下载任务')
  }
  return <>
    <div className={styles.downloadIcon}>
      <span className={styles.cancelDownload} onClick={handleDelete}>
        ×
      </span>
      <Progress className={styles.downloadProgress} percent={percent} size={30} type='circle' status="active"/>
    </div>
  </>
}
const DownloadProgress = () => {
  const [messageApi, contextHolder] = message.useMessage()
  const {
    downloadList,
    clearDownloadList,
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
                  {item.size || '未知大小'}
                </p>
              </div>
            </div>
            <div className={styles.itemRight}>
              {
                item.flag === 'downloading' ? <DownloadIcon appId={item.appId}/> : <button className={styles.downloadBtn}>打开</button>
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


