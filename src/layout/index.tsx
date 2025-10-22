import styles from './index.module.scss'
import { Outlet } from 'react-router-dom'
import { Suspense, useState, useEffect } from 'react'
import Titlebar from './titlebar'
import Sidebar from './sidebar'
import LaunchPage from './launchPage'
import Loading from '../components/Loading'
import { useInitStore } from '@/stores/global'
import { arch } from '@tauri-apps/plugin-os'

const Layout = () => {
  const onInited = useInitStore((state) => state.onInited)
  const getUpdateAppNum = useInitStore((state) => state.getUpdateAppNum)
  const changeArch = useInitStore((state) => state.changeArch)
  const [isInit, setIsInit] = useState(true)

  useEffect(() => {
    // 获取系统架构
    const currentArch = arch()
    changeArch(currentArch)
    // 每次渲染后都会执行此处的代码
    const timer = setTimeout(()=>{
      // 首屏需要加载和查询的配置完成后更改初始化状态
      setIsInit(false)
      onInited()
      // 获取需要更新的APP数量
      getUpdateAppNum(Math.floor(Math.random() * 10))
    }, 3000)
    return ()=>{
      clearTimeout(timer)
    }
  })

  return (
    <div className={styles.layout}>
      <Titlebar/>
      {
        isInit ? <LaunchPage /> : <div className={styles.layoutContent}>
          <Sidebar className={styles.sider} />
          <div className={styles.content}>
            <div className={styles.contentInner}>
              <Suspense fallback={<Loading />}>
                <Outlet />
              </Suspense>
            </div>
          </div>
        </div>
      }
    </div>
  )
}

export default Layout
