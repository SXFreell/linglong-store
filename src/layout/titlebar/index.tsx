/**
 * 标题栏组件
 * 包含应用标题、搜索框、窗口控制按钮和下载管理
 */

import styles from './index.module.scss'
import { useCallback, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react'
import { Close, Copy, Minus, Square } from '@icon-park/react'
import { Modal, message } from 'antd'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { cancelInstall, quitApp } from '@/apis/invoke'
import { useInstallQueueStore } from '@/stores/installQueue'
import { useSearchStore } from '@/stores/global'
import searchIcon from '@/assets/icons/searchIcon.svg'
import cleanIcon from '@/assets/icons/clean.svg'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * 标题栏组件
 * 处理窗口控制、搜索功能和下载管理
 */
const Titlebar = ({ showSearch }: { showSearch: boolean}) => {
  /** 当前安装任务 */
  const currentTask = useInstallQueueStore((state) => state.currentTask)
  /** 检查是否有正在进行的安装任务 */
  const hasActiveTasks = useInstallQueueStore((state) => state.hasActiveTasks)
  /** 清空待安装队列 */
  const clearQueue = useInstallQueueStore((state) => state.clearQueue)
  /** 更新搜索关键词的方法 */
  const changeKeyword = useSearchStore((state) => state.changeKeyword)
  /** 重置搜索关键词的方法 */
  const resetKeyword = useSearchStore((state) => state.resetKeyword)
  /** 当前窗口实例 */
  const appWindow = getCurrentWindow()
  /** 窗口最大化状态 */
  const [isMaximized, setIsMaximized] = useState(false)
  /** 下载管理面板显示状态 */
  // const [hasDownloading, setHasDownloading] = useState(false)


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
   * 统一的退出确认逻辑
   * 检查是否有安装任务，有则弹出确认框
   */
  const handleQuit = useCallback(async() => {
    try {
      // 检查是否有安装任务
      if (hasActiveTasks()) {
        Modal.confirm({
          title: '有安装任务正在进行',
          content: '当前有应用正在安装或等待安装，退出将会取消这些安装任务。确定要退出吗？',
          okText: '取消安装并退出',
          cancelText: '暂不退出',
          okButtonProps: { danger: true },
          onOk: async() => {
            try {
              // 取消当前正在进行的安装
              if (currentTask) {
                await cancelInstall(currentTask.appId)
              }
              // 清空待安装队列
              clearQueue()
              // 调用 Rust 端退出命令
              await quitApp()
            } catch (error) {
              console.error('Failed to cancel install and quit:', error)
              // 即使取消失败也尝试退出
              await quitApp()
            }
          },
        })
        return
      }

      // 没有安装任务，直接退出
      await quitApp()
    } catch (error) {
      console.error('Failed to quit:', error)
    }
  }, [hasActiveTasks, currentTask, clearQueue])

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
   * 退出应用，如有安装任务先确认是否取消
   */
  const handleClose = async() => {
    try {
      await handleQuit()
    } catch (error) {
      console.error('Failed to close:', error)
    }
  }


  /**
   * 处理搜索框输入变化
   * @param event - 输入事件对象
   */
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setRealKeyword(event.target.value)
  }

  /**
   * 处理搜索框键盘事件
   * Enter键触发搜索，Delete键清空输入
   * @param event - 键盘事件对象
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch()
      event.preventDefault()
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
        <span className={styles.title}>玲珑应用商店社区版</span>
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
              placeholder='在这里搜索你想搜索的应用'
            />
          </div>
          <div className={styles.inputIcon}>
            {/* 清空按钮（仅在有关键词时显示） */}
            {realKeyword ? <img src={cleanIcon} onClick={handleClean} width='50%' height='100%' alt="清空" /> : null}
            {/* 搜索按钮 */}
            <img src={searchIcon} onClick={handleSearch} width='50%' height='100%' alt="搜索" />
          </div>
        </div> : null
      }
      {/* 右侧：下载管理和窗口控制按钮 */}
      <div className={styles.titlebarRight}>
        {/* 下载管理按钮（仅在初始化完成后显示） */}
        {/* {showDownload ? <Popover
          trigger='click'
          title='下载管理'
          content={<DownloadProgress/>}>
          <span className={styles.title}>
            <img src={hasDownloading ? downloadA : download} alt="下载" />
          </span>
        </Popover> : null} */}
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
