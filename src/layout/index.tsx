import styles from './index.module.scss'

import { Outlet } from 'react-router-dom'
import { Suspense, useState, useEffect } from 'react'

import Titlebar from './titlebar'
import Sidebar from './sidebar'
import LaunchPage from './launchPage'
import Loading from '../components/Loading'

const Layout = () => {
  const [isInit, setIsInit] = useState(true)
  useEffect(() => {
    // 每次渲染后都会执行此处的代码
    const timer = setTimeout(()=>{
      setIsInit(false)
    }, 5000)
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
