/**
 * 应用布局组件
 * 包含标题栏、侧边栏和主内容区域
 * 负责应用初始化和主界面布局
 */

import styles from './index.module.scss'
import { Outlet } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import Titlebar from './titlebar'
import Sidebar from './sidebar'
import LaunchPage from './launchPage'
import Loading from '../components/Loading'
import { useInitStore } from '@/stores/global'
import { useConfigStore } from '@/stores/appConfig'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { arch } from '@tauri-apps/plugin-os'

// 暂时注释的 Antd Layout 组件，可能用于未来的布局重构
// import { Layout } from 'antd'
// const { Header, Sider, Content } = Layout

/**
 * 主应用布局组件
 * 管理应用的初始化状态和主要布局结构
 */
const AppLayout = () => {
  // 从全局状态store中获取初始化相关方法
  const onInited = useInitStore((state) => state.onInited)
  const getUpdateAppNum = useInitStore((state) => state.getUpdateAppNum)
  const changeArch = useInitStore((state) => state.changeArch)

  /** 初始化状态标志，控制是否显示启动页面 */
  const [isInit, setIsInit] = useState(true)

  /** 从已安装应用store中获取更新和加载方法 */
  const {
    needUpdateApps,
    fetchInstalledApps,
  } = useInstalledAppsStore()

  /** 从配置store中获取是否显示基础服务的设置 */
  const { showBaseService } = useConfigStore()

  /** 监听基础服务显示配置变化，重新加载应用列表 */
  useEffect(() => {
    fetchInstalledApps(showBaseService)
  }, [showBaseService, fetchInstalledApps])

  /**
   * 应用初始化效果
   * 1. 获取并设置系统架构
   * 2. 完成初始化配置
   * 3. 统计需要更新的应用数量
   */
  useEffect(() => {
    const currentArch = arch()
    changeArch(currentArch)
    setIsInit(false)
    onInited()
    getUpdateAppNum(needUpdateApps.length || 0)
  }, [])

  /**
   * 渲染应用布局
   * 初始化时显示启动页面
   * 初始化完成后显示主布局（包含侧边栏和内容区）
   */
  return (
    <div className={styles.layout}>
      {/* 标题栏组件，始终显示 */}
      <Titlebar/>
      {
        // 根据初始化状态决定显示启动页还是主布局
        isInit ? <LaunchPage /> : <div className={styles.layoutContent}>
          {/* 侧边栏导航 */}
          <Sidebar className={styles.sider} />
          {/* 主内容区域，使用 Suspense 处理异步加载 */}
          <div className={styles.content}>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      }
    </div>
  )
  // 备选的 Antd Layout 布局方案
  // return (
  //   <Layout>
  //     <Header>
  //       <Titlebar/>
  //     </Header>
  //     <Layout>
  //       <Sider>
  //         <Sidebar className={styles.sider} />
  //       </Sider>
  //       <Content className={styles.content}>
  //         <Suspense fallback={<Loading />}>
  //           <Outlet />
  //         </Suspense>
  //       </Content>
  //     </Layout>
  //   </Layout>
  // )
}

export default AppLayout
