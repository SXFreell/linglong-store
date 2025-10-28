import styles from './index.module.scss'
import { SetStateAction, useEffect, useState } from 'react'
import { Close, Copy, Minus, Square } from '@icon-park/react'
import { Popover, message } from 'antd'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useInitStore, useSearchStore } from '@/stores/global'
import searchIcon from '@/assets/icons/searchIcon.svg'
import cleanIcon from '@/assets/icons/clean.svg'
import download from '@/assets/icons/download.svg'
import downloadA from '@/assets/icons/downloadA.svg'
import DownloadProgress from '@/components/DownloadProgress'
import { useNavigate, useLocation } from 'react-router-dom'

const Titlebar = () => {
  const loadingInit = useInitStore((state) => state.loadingInit)
  const keyword = useSearchStore((state) => state.keyword)
  const changeKeyword = useSearchStore((state) => state.changeKeyword)
  const resetKeyword = useSearchStore((state) => state.resetKeyword)
  const appWindow = getCurrentWindow()
  const [isMaximized, setIsMaximized] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState(false)
  const [realKeyword, setRealKeyword] = useState('')

  const navigate = useNavigate()
  const location = useLocation()
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

  const handleDownload = ()=>{
    setDownloadStatus(!downloadStatus)
  }

  // 定义一个处理输入变化的函数
  const handleInputChange = (event: { target: { value: SetStateAction<string> } }) => {
    const keyword = event.target.value as string
    setRealKeyword(keyword)
  }

  // 按下enter则搜索，按下delete则删除
  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    if (event.key === 'Enter') {
      handleSearch()
      // 可以阻止默认行为，例如提交表单的默认行为
      event.preventDefault()
    }
    if (event.key === 'Delete') {
      handleClean()
      // 可以阻止默认行为，例如提交表单的默认行为
      event.preventDefault()
    }
  }

  const handleClean = ()=>{
    setRealKeyword('')
    resetKeyword()
  }

  const handleSearch = ()=>{
    console.log(location, 'locationlocationlocationlocationlocation')

    if (realKeyword) {
      changeKeyword(realKeyword)
      if (location.pathname !== '/search_list') {
        navigate('/search_list')
        return
      }
      return
    }
    message.info('请输入查询条件！')
  }

  return (
    <div className={styles.titlebar} data-tauri-drag-region="true">
      <div className={styles.titlebarLeft}>
        <img src="/logo.svg" alt="logo" className={styles.logo} draggable={false} />
        <span className={styles.title}>如意玲珑应用商店</span>
      </div>
      {
        loadingInit ? <div className={styles.titlebarCenter}>
          <div className={styles.inputBox}>
            <input type="text" className={styles.input} value={realKeyword} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder='搜索'/>
          </div>
          <div className={styles.inputIcon}>{
            keyword ? <img src={cleanIcon} onClick={handleClean} width='50%' height='100%' alt="清空" /> : null
          }

          <img src={searchIcon} onClick={handleSearch} width='50%' height='100%' alt="搜索" />
          </div>
        </div> : null
      }
      <div className={styles.titlebarRight}>
        {loadingInit ? <Popover trigger='click' placement="bottomRight"
          title='下载管理'
          content={<DownloadProgress/>}><span className={styles.title} onClick={handleDownload}><img src={downloadStatus ? downloadA : download} alt="下载" /></span> </Popover> : null}
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
