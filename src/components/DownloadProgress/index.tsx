import styles from './index.module.scss'
import { useEffect, useMemo, useState } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'
import { Progress } from 'antd'
import { PauseOutlined, CaretRightOutlined } from '@ant-design/icons'
const DownloadIcon = ({ percent = 10, appId = '123', downloadStatus = '1' })=>{
  const [isDownload, setIsDownloading] = useState(true)
  useEffect(()=>{
    if (downloadStatus === '1') {
      setIsDownloading(true)
    } else {
      setIsDownloading(false)
    }
  }, [downloadStatus])
  const changeDownload = ()=>{
    console.log(appId, 'appId')

    setIsDownloading(prev => !prev)


  }
  const handleDelete = ()=>{
    console.log('删除下载任务')
  }
  return <>
    <div className={styles.downloadIcon}>
      <div className={styles.cancelDownload} onClick={handleDelete}>
        ×
      </div>
      <div className={styles.downloadSetting}>
        {isDownload ? <Progress className={styles.downloadProgress} percent={percent} size={30} type='circle'/> : null}
        <div className={isDownload ? styles.downloadStatus : styles.downloadStatusA} onClick={changeDownload}>
          {isDownload ? <CaretRightOutlined /> : <PauseOutlined />}
        </div>
      </div>

    </div>
  </>
}
const DownloadProgress = () => {
  const [isFinished] = useState(false)
  // 获取图标 URL
  const iconUrl = useMemo(() => {
    return DefaultIcon
  }, [])
  return <>
    <div className={styles.downloadContainer}>
      <div className={styles.downloadBox} >
        <div className={styles.downloadItem} >
          <div className={styles.itemLeft}>
            <div className={styles.itemLeft_icon}><img src={iconUrl} alt={'应用图标'} /></div>
            <div className={styles.itemLeft_content}>
              <p className={styles.contentName}>
                应用名称  应用名称 应用名称  应用名称  应用名称  应用名称  应用名称  应用名称
              </p>
              <p className={styles.contentSize}>
               200M
              </p>
            </div>
          </div>
          <div className={styles.itemRight}>
            {isFinished ? <Progress className={styles.downloadProgress} percent={30} size={30} type='circle'/> : <button className={styles.downloadBtn}>打开</button>}
          </div>
        </div>
        <div className={styles.downloadItem} >
          <div className={styles.itemLeft}>
            <div className={styles.itemLeft_icon}><img src={iconUrl} alt={'应用图标'} /></div>
            <div className={styles.itemLeft_content}>
              <p className={styles.contentName}>
                应用名称  应用名称 应用名称  应用名称  应用名称  应用名称  应用名称  应用名称
              </p>
              <p className={styles.contentSize}>
               200M
              </p>
            </div>
          </div>
          <div className={styles.itemRight}>
            <DownloadIcon percent={30} appId={'123456'} downloadStatus={'1'}/>
          </div>
        </div>
      </div>
      <div className={styles.downloadFooter} >清除下载记录</div>
    </div>
  </>
}
export default DownloadProgress


