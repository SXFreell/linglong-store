import { Switch } from '@arco-design/web-react'
import styles from './index.module.scss'
import { useState } from 'react'
const BasicSetting = ()=>{
  const [autoCheck, setAutoCheck] = useState(false)
  const [showBaseService, setShowBaseService] = useState(false)
  const autoCheckClick = ()=>{
    setAutoCheck(!autoCheck)
  }
  const showBaseServiceClick = ()=>{
    setShowBaseService(!showBaseService)
  }
  const clearAbandonServiceClick = ()=>{
    console.log('清除废弃基础服务')

  }
  return (
    <div className={styles.setting}>
      <div className={styles.basic_setting}>
        <p className={styles.setting_name}>基础设置</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <Switch size='small' checked={autoCheck} defaultChecked={autoCheck} onChange={autoCheckClick}/><span className={styles.item_label}>启动App自动检测商店版本</span>
          </div>
        </div>
      </div>
      <div className={styles.remove_setting}>
        <p className={styles.setting_name}>卸载程序</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <Switch size='small' checked={showBaseService} defaultChecked={showBaseService} onChange={showBaseServiceClick}/><span className={styles.item_label}>显示基础运行服务</span>
          </div>
          <p className={styles.clean_basic} onClick={clearAbandonServiceClick}>清除废弃基础服务</p>
        </div>
      </div>
    </div>
  )
}

export default BasicSetting
