import styles from './index.module.scss'

import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'

import Titlebar from './titlebar'
import Sidebar from './sidebar'
import Loading from '../components/Loading'

const Layout = () => {
  return (
    <div className={styles.layout}>
      <Titlebar/>
      <div className={styles.layoutContent}>
        <Sidebar className={styles.sider} />
        <div className={styles.content}>
          <div className={styles.contentInner}>
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
