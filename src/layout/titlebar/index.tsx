import styles from './index.module.scss'

import { useEffect, useState } from 'react'
import { IconFullscreen, IconFullscreenExit, IconMinus, IconClose } from '@arco-design/web-react/icon'
import { getCurrentWindow } from '@tauri-apps/api/window'

const Titlebar = () => {

  const appWindow = getCurrentWindow()
  const [isMaximized, setIsMaximized] = useState(false)

  const handleFullscreen = async() => {
    try {
      await appWindow.toggleMaximize()
    } catch (error) {
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
      console.error('Failed to minimize:', error)
    }
  }

  const handleClose = async() => {
    try {
      await appWindow.close()
    } catch (error) {
      console.error('Failed to close:', error)
    }
  }

  return (
    <div className={styles.titlebar} data-tauri-drag-region="true">
      <div className={styles.titlebarLeft}>
        <img src="/logo.svg" alt="logo" className={styles.logo} draggable={false} />
        <span className={styles.title}>如意玲珑应用商店</span>
      </div>
      <div className={styles.titlebarRight}>
        <span className={styles.title} onClick={handleMinimize}><IconMinus /></span>
        <span className={styles.title} onClick={handleFullscreen}>
          {isMaximized ? <IconFullscreenExit /> : <IconFullscreen />}
        </span>
        <span className={styles.title} onClick={handleClose}><IconClose /></span>
      </div>
    </div>
  )
}

export default Titlebar
