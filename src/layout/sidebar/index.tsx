import styles from './index.module.scss'
import { useNavigate, useLocation } from 'react-router-dom'

import menuList from './components/menuList'
import SpeedTool from './components/speedTool'

import { Popover } from '@arco-design/web-react'
import { Speed } from '@icon-park/react'
import { useState } from 'react'

const Sidebar = ({ className }: { className: string }) => {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [appUpdateSum, setAppUpdateSum] = useState(10)

  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = (menuPath: string) => {
    navigate(menuPath)
  }

  return (
    <div className={`${styles.sidebar} ${className}`}>
      <div className={styles.menu}>
        {
          menuList.map((item, index) => {
            const isActive = location.pathname === item.menuPath
            return (
              <div
                className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
                key={index}
                onClick={() => handleMenuClick(item.menuPath)}
                style={{ cursor: 'pointer' }}
              >
                <span className={styles.menuItemIcon}>
                  {isActive ? item.activeIcon : item.icon}
                </span>
                <span className={styles.menuItemText}>{item.menuName}<i className={appUpdateSum > 0 && item.menuName === '软件更新' ? styles.additional : styles.notAdditional}>{appUpdateSum}</i> </span>
              </div>
            )
          })
        }
      </div>
      <div className={styles.speedToolContainer}>
        <div className={styles.speedTool}>
          <SpeedTool />
        </div>
        <div className={styles.speedToolIcon}>
          <Popover
            trigger='click'
            position='right'
            unmountOnExit={false}
            content={
              <SpeedTool />
            }
          >
            <Speed theme="outline" size="16" fill="var(--color-text-1)"/>
          </Popover>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
