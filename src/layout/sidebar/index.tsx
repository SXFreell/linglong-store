import styles from "./index.module.scss";

import menuList from "./components/menuList";
import SpeedTool from "./components/speedTool";

const Sidebar = ({ className }: { className: string }) => {
  return (
    <div className={`${styles.sidebar} ${className}`}>
      <div className={styles.menu}>
        {
          menuList.map((item, index) => (
            <div className={`${styles.menuItem} ${index === 0 ? styles.active : ''}`} key={index}>
              <span className={styles.menuItemIcon}>{index === 0 ? item.activeIcon : item.icon}</span>
              <span className={styles.menuItemText}>{item.menuName}</span>
            </div>
          ))
        }
      </div>
      <SpeedTool />
    </div>
  )
};

export default Sidebar;