import styles from './index.module.scss'
import { useEffect, useState } from 'react'
import { Close, Copy, Minus, Square } from '@icon-park/react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import searchIcon from '@/assets/icons/searchIcon.svg'
import download from '@/assets/icons/download.svg'
import downloadA from '@/assets/icons/downloadA.svg'
const Titlebar = () => {
  const appWindow = getCurrentWindow()
  const [isMaximized, setIsMaximized] = useState(false)

  const [downloadStatus, setDownloadStatus] = useState(false)
  const handleFullscreen = async() => {
    try {
      await appWindow.toggleMaximize()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to toggle maximize:', error)
    }
  }
  useEffect(() => {
    // 初始化最大化状态
    appWindow.isMaximized().then(setIsMaximized)
    // 监听窗口尺寸变化，判断最大化状态
    const unlistenResized = appWindow.onResized(async() => {
      setIsMaximized(await appWindow.isMaximized())
    })
    return () => {
      unlistenResized.then((f: () => void) => f())
    }
  }, [appWindow])

  const handleMinimize = async() => {
    try {
      await appWindow.minimize()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to minimize:', error)
    }
  }

  const handleClose = async() => {
    try {
      await appWindow.close()
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to close:', error)
    }
  }
  const handleDownload = ()=>{
    console.log('下载')
    setDownloadStatus(!downloadStatus)

  }
  return (
    <div className={styles.titlebar} data-tauri-drag-region="true">
      <div className={styles.titlebarLeft}>
        <img src="/logo.svg" alt="logo" className={styles.logo} draggable={false} />
        <span className={styles.title}>如意玲珑应用商店</span>
      </div>
      <div className={styles.titlebarCenter}>
        <div className={styles.inputBox}>
          <input type="text" className={styles.input} placeholder='搜索'/>
        </div>
        <div className={styles.inputIcon}>
          <img src={searchIcon} width='100%' height='100%' alt="搜索" />
        </div>
      </div>
      <div className={styles.titlebarRight}>
        <span className={styles.title} onClick={handleDownload}><img src={downloadStatus ? downloadA : download} alt="下载" /></span>
        <span className={styles.title} onClick={handleMinimize}><Minus size={18} /></span>
        <span className={styles.title} onClick={handleFullscreen}>
          {isMaximized ? <Copy /> : <Square />}
        </span>
        <span className={styles.title} onClick={handleClose}><Close /></span>
      </div>
    </div>
  )
}

export default Titlebar
