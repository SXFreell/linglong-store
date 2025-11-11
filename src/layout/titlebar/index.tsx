/**
 * 标题栏组件
 * 包含应用标题、搜索框、窗口控制按钮和下载管理
 */

import styles from './index.module.scss'
import { SetStateAction, useEffect, useState } from 'react'
import { Close, Copy, Minus, Square } from '@icon-park/react'
import { Popover, message } from 'antd'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useConfigStore, useDownloadConfigStore } from '@/stores/appConfig'
import { useSearchStore } from '@/stores/global'
import searchIcon from '@/assets/icons/searchIcon.svg'
import cleanIcon from '@/assets/icons/clean.svg'
import download from '@/assets/icons/download.svg'
import downloadA from '@/assets/icons/downloadA.svg'
import DownloadProgress from '@/components/DownloadProgress'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * 标题栏组件
 * 处理窗口控制、搜索功能和下载管理
 */
const Titlebar = ({ showSearch, showDownload }: { showSearch: boolean, showDownload: boolean }) => {
  /** 应用初始化状态 */
  const closeOrHide = useConfigStore((state) => state.closeOrHide)
  const downloadList = useDownloadConfigStore((state) => state.downloadList)
  /** 全局搜索关键词 */
  const keyword = useSearchStore((state) => state.keyword)
  /** 更新搜索关键词的方法 */
  const changeKeyword = useSearchStore((state) => state.changeKeyword)
  /** 重置搜索关键词的方法 */
  const resetKeyword = useSearchStore((state) => state.resetKeyword)
  /** 当前窗口实例 */
  const appWindow = getCurrentWindow()
  /** 窗口最大化状态 */
  const [isMaximized, setIsMaximized] = useState(false)
  /** 下载管理面板显示状态 */
  const [hasDownloading, setHasDownloading] = useState(false)


  /** 搜索框实时输入的关键词 */
  const [realKeyword, setRealKeyword] = useState('')

  /** 路由导航工具 */
  const navigate = useNavigate()
  /** 当前路由位置 */
  const location = useLocation()
  /**
   * 切换窗口最大化状态
   */
  const handleFullscreen = async() => {
    try {
      await appWindow.toggleMaximize()
    } catch (error) {
      console.error('Failed to toggle maximize:', error)
    }
  }
  /**
   * 监听下载列表变化，更新是否有下载中的应用标志
   */
  useEffect(() => {
    const downloading = downloadList.some((app) => app.flag === 'downloading')
    setHasDownloading(downloading)
  }, [downloadList])
  /**
   * 监听窗口状态变化
   * 初始化最大化状态并监听窗口大小变化
   */
  useEffect(() => {
    // 初始化最大化状态
    appWindow.isMaximized().then(setIsMaximized)
    // 监听窗口尺寸变化，判断最大化状态
    const unlistenResized = appWindow.onResized(async() => {
      setIsMaximized(await appWindow.isMaximized())
    })
    // 清理监听器
    return () => {
      unlistenResized.then((f: () => void) => f())
    }
  }, [appWindow])

  /**
   * 最小化窗口
   */
  const handleMinimize = async() => {
    try {
      await appWindow.minimize()
    } catch (error) {
      console.error('Failed to minimize:', error)
    }
  }

  /**
   * 关闭窗口
   */
  const handleClose = async() => {
    try {
      switch (closeOrHide) {
      case 'hide':
        await appWindow.hide()
        break
      case 'close':
        await appWindow.close()
        break

      default:
        await appWindow.close()
        break
      }

    } catch (error) {
      console.error('Failed to close:', error)
    }
  }


  /**
   * 处理搜索框输入变化
   * @param event - 输入事件对象
   */
  const handleInputChange = (event: { target: { value: SetStateAction<string> } }) => {
    const keyword = event.target.value as string
    setRealKeyword(keyword)
  }

  /**
   * 处理搜索框键盘事件
   * Enter键触发搜索，Delete键清空输入
   * @param event - 键盘事件对象
   */
  const handleKeyDown = (event: { key: string; preventDefault: () => void }) => {
    if (event.key === 'Enter') {
      handleSearch()
      event.preventDefault() // 阻止表单提交的默认行为
    }
    if (event.key === 'Delete') {
      handleClean()
      event.preventDefault()
    }
  }

  /**
   * 清空搜索框内容
   * 同时重置全局搜索状态
   */
  const handleClean = ()=>{
    setRealKeyword('')
    resetKeyword()
  }

  /**
   * 执行搜索操作
   * 1. 更新全局搜索关键词
   * 2. 如果不在搜索结果页则跳转
   * 3. 空关键词时提示用户
   */
  const handleSearch = ()=>{
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

  /**
   * 渲染标题栏组件
   */
  return (
    <div className={styles.titlebar} data-tauri-drag-region="true">
      {/* 左侧：Logo和标题 */}
      <div className={styles.titlebarLeft}>
        <img src="/logo.svg" alt="logo" className={styles.logo} draggable={false} />
        <span className={styles.title}>如意玲珑应用商店</span>
      </div>
      {/* 中间：搜索框（仅在初始化完成后显示） */}
      {
        showSearch ? <div className={styles.titlebarCenter}>
          <div className={styles.inputBox}>
            <input
              type="text"
              className={styles.input}
              value={realKeyword}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder='搜索'
            />
          </div>
          <div className={styles.inputIcon}>
            {/* 清空按钮（仅在有关键词时显示） */}
            {keyword ? <img src={cleanIcon} onClick={handleClean} width='50%' height='100%' alt="清空" /> : null}
            {/* 搜索按钮 */}
            <img src={searchIcon} onClick={handleSearch} width='50%' height='100%' alt="搜索" />
          </div>
        </div> : null
      }
      {/* 右侧：下载管理和窗口控制按钮 */}
      <div className={styles.titlebarRight}>
        {/* 下载管理按钮（仅在初始化完成后显示） */}
        {showDownload ? <Popover
          trigger='click'
          title='下载管理'
          content={<DownloadProgress/>}>
          <span className={styles.title}>
            <img src={hasDownloading ? downloadA : download} alt="下载" />
          </span>
        </Popover> : null}
        {/* 窗口控制按钮 */}
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
