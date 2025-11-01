import styles from './index.module.scss'
import { useMemo } from 'react'
import DefaultIcon from '@/assets/linyaps.svg'
import { Progress } from 'antd'
const DownloadIcon = ({ percent = 10, appId = '123' })=>{

  const handleDelete = ()=>{
    console.log(appId, '删除下载任务')
  }
  return <>
    <div className={styles.downloadIcon}>
      <span className={styles.cancelDownload} onClick={handleDelete}>
        ×
      </span>
      <Progress className={styles.downloadProgress} percent={percent} size={30} type='circle'/>
    </div>
  </>
}
const DownloadProgress = () => {
  // const [isFinished] = useState(false)
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
            <button className={styles.downloadBtn}>打开</button>
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
            <DownloadIcon percent={30} appId={'123456'}/>
          </div>
        </div>
      </div>
      <div className={styles.downloadFooter} >清除下载记录</div>
    </div>
  </>
}
export default DownloadProgress


