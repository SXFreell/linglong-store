import styles from './index.module.scss'
import { useNavigate, useLocation } from 'react-router-dom'
import menuList from './components/menuList'
import SpeedTool from './components/speedTool'
import { Popover } from 'antd'
import { Speed } from '@icon-park/react'
import { useInitStore, useSearchStore } from '@/stores/global'

const Sidebar = ({ className }: { className: string }) => {
  const updateAppSum = useInitStore((state) => state.updateAppNum)
  const resetKeyword = useSearchStore((state) => state.resetKeyword)
  const navigate = useNavigate()
  const location = useLocation()

  const handleMenuClick = (menuPath: string) => {
    resetKeyword()
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
                <span className={styles.menuItemText}>{item.menuName}<i className={updateAppSum > 0 && item.menuName === '软件更新' ? styles.additional : styles.notAdditional}>{updateAppSum}</i> </span>
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
            content={
              <SpeedTool />
            }
          >
            <Speed theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>
          </Popover>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
