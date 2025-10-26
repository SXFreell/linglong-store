import styles from './index.module.scss'
import { useMemo, useState } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'
import { Progress } from '@arco-design/web-react'
import { Pause, PlayOne } from '@icon-park/react'
const DownloadIcon = ({ percent = 10, isDownload = true })=>{
  return <>
    <div className={styles.downloadIcon}>
      <span className={styles.downloadPercent}>{percent}%</span>
      <div className={styles.downloadStatus}>
        {isDownload ? <Pause theme="outline" size="32" fill="var(--color-primary-light-1)"/> : <PlayOne theme="outline" size="32" fill='var(--color-primary-light-1)'/>}
      </div>
    </div>
  </>
}
const DownloadProgress = ()=>{
  const [isFinished] = useState(false)
  // 获取图标 URL
  const iconUrl = useMemo(() => {
    return DefaultIcon
  })
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
            {isFinished ? <Progress className={styles.downloadProgress} percent={30} formatText={(percent: number)=><DownloadIcon percent={percent}/>} type='circle' size='small' trailColor='var(--color-primary-light-1)' /> : <button className={styles.downloadBtn}>打开</button>}

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
            <Progress className={styles.downloadProgress} percent={30} formatText={(percent: number)=><DownloadIcon percent={percent}/>} type='circle' size='small' trailColor='var(--color-primary-light-1)' />

          </div>
        </div>
      </div>
      <div className={styles.downloadFooter} >清除下载记录</div>
    </div>
  </>
}
export default DownloadProgress
