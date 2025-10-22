import styles from "./index.module.scss";

import { useEffect, useState } from "react";
import { IconFullscreen, IconMinus, IconClose } from "@arco-design/web-react/icon";
import { getCurrentWindow } from '@tauri-apps/api/window';

const Titlebar = () => {

  const [appWindow, _] = useState(getCurrentWindow());

  const handleFullscreen = () => {
    appWindow.toggleMaximize();
  };

  const handleMinimize = () => {
    appWindow.minimize();
  };

  const handleClose = () => {
    appWindow.close();
  };
  
  return (
    <div className={styles.titlebar} data-tauri-drag-region="true">
      <div className={styles.titlebarLeft}>
        <img src="/logo.svg" alt="logo" className={styles.logo} draggable={false} />
        <span className={styles.title}>App Store</span>
      </div>
      <div className={styles.titlebarRight}>
        <span className={styles.title} onClick={handleMinimize}><IconMinus /></span>
        <span className={styles.title} onClick={handleFullscreen}><IconFullscreen /></span>
        <span className={styles.title} onClick={handleClose}><IconClose /></span>
      </div>
    </div>
  );
};

export default Titlebar;