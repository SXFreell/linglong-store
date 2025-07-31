import styles from "./index.module.scss";
import { useNavigate, useLocation } from "react-router-dom";

import menuList from "./components/menuList";
import SpeedTool from "./components/speedTool";

const Sidebar = ({ className }: { className: string }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleMenuClick = (menuPath: string) => {
    navigate(menuPath);
  };

  return (
    <div className={`${styles.sidebar} ${className}`}>
      <div className={styles.menu}>
        {
          menuList.map((item, index) => {
            const isActive = location.pathname === item.menuPath;
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
                <span className={styles.menuItemText}>{item.menuName}</span>
              </div>
            );
          })
        }
      </div>
      <SpeedTool />
    </div>
  )
};

export default Sidebar;