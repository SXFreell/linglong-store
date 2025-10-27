import styles from './index.module.scss'
import { useMemo, useState } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'
import { Progress } from 'antd'
import { Pause, PlayOne } from '@icon-park/react'
const DownloadIcon = ({ percent = 10, isDownload = true })=>{


  const changeDownload = ()=>{
    console.log('暂停/开始下载')

  }
  return <>
    <div className={styles.downloadIcon}>
      <Progress className={styles.downloadProgress} percent={percent} size={30} type='circle'/>
      <div className={styles.downloadStatus} onClick={changeDownload}>
        {isDownload ? <Pause theme="outline" size="32" fill="#ddd"/> : <PlayOne theme="outline" size="32" fill='#ddd'/>}
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
            <DownloadIcon percent={30}/>
          </div>
        </div>
      </div>
      <div className={styles.downloadFooter} >清除下载记录</div>
    </div>
  </>
}
export default DownloadProgress
