/**
 * 应用布局组件
 * 包含标题栏、侧边栏和主内容区域
 * 负责应用初始化和主界面布局
 */

import styles from './index.module.scss'
import { useEffect } from 'react'
import Titlebar from './titlebar'
import Sidebar from './sidebar'
import LaunchPage from './launchPage'
import KeepAliveOutlet from '@/components/KeepAliveOutlet'

import { useGlobalStore } from '@/stores/global'
import { useUpdatesStore } from '@/stores/updates'
import { useConfigStore } from '@/stores/appConfig'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { sendVisitRecord } from '@/services/analyticsService'
import { getCustomMenuCategory } from '@/apis/apps'

/**
 * 主应用布局组件
 * 管理应用的初始化状态和主要布局结构
 */
const AppLayout = () => {
  const { isInited, setCustomMenuCategory } = useGlobalStore()
  const startAutoRefresh = useUpdatesStore(state => state.startAutoRefresh)
  const stopAutoRefresh = useUpdatesStore(state => state.stopAutoRefresh)
  // 获取自定义菜单配置
  useEffect(() => {
    getCustomMenuCategory().then((res) => {
      if (res.data?.menus && res.data?.menus.length > 0) {
        setCustomMenuCategory(res.data?.menus)
      }
    })
  }, [])


  // 初始化完成后发送访问记录
  useEffect(() => {
    if (isInited) {
      sendVisitRecord().catch((err) => console.warn('[AppLayout] Auto sendVisitRecord failed', err))
    }
  }, [isInited])

  useEffect(() => {
    startAutoRefresh()
    return () => {
      stopAutoRefresh()
    }
  }, [startAutoRefresh, stopAutoRefresh])

  /** 从已安装应用store中获取更新和加载方法 */
  const {
    fetchInstalledApps,
  } = useInstalledAppsStore()

  /** 从配置store中获取是否显示基础服务的设置 */
  const { showBaseService } = useConfigStore()

  /** 监听基础服务显示配置变化，重新加载应用列表（仅在初始化完成后响应配置变更） */
  useEffect(() => {
    // 初始加载已由 useLaunch.initialize() 完成，此处仅在初始化后响应配置变更
    if (isInited) {
      fetchInstalledApps(showBaseService)
    }
  }, [showBaseService]) // 仅监听 showBaseService 变化，不包含 isInited 避免初始化完成时重复加载

  /**
   * 渲染应用布局
   * 初始化时显示启动页面
   * 初始化完成后显示主布局（包含侧边栏和内容区）
   */
  return (
    <div className={styles.layout}>
      {/* 标题栏组件，始终显示 */}
      <Titlebar showSearch={isInited}/>
      {
        // 根据初始化状态决定显示启动页还是主布局
        isInited ? <div className={styles.layoutContent}>
          {/* 侧边栏导航 */}
          <Sidebar className={styles.sider} />
          {/* 主内容区域，使用 Suspense 处理异步加载 */}
          <div className={styles.content}>
            <KeepAliveOutlet />
          </div>
        </div> : <LaunchPage />
      }
    </div>
  )
}

export default AppLayout
