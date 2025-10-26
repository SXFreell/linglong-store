import { Switch } from 'antd'
import styles from './index.module.scss'
import { useConfigStore } from '@/stores/appConfig'
const BasicSetting = ()=>{
  const checkVersion = useConfigStore((state) => state.checkVersion)
  const showBaseService = useConfigStore((state) => state.showBaseService)
  const changeCheckVersionStatus = useConfigStore((state) => state.changeCheckVersionStatus)
  const changeBaseServiceStatus = useConfigStore((state) => state.changeBaseServiceStatus)
  const autoCheckClick = ()=>{
    changeCheckVersionStatus(!checkVersion)
  }
  const showBaseServiceClick = ()=>{
    changeBaseServiceStatus(!showBaseService)
  }
  const clearAbandonServiceClick = () => {
    console.info('清除废弃基础服务')
  }
  return (
    <div className={styles.setting} style={{ padding: 20 }}>
      <div className={styles.basic_setting}>
        <p className={styles.setting_name}>基础设置</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <Switch checked={checkVersion} onChange={autoCheckClick}/><span className={styles.item_label}>启动App自动检测商店版本</span>
          </div>
        </div>
      </div>
      <div className={styles.remove_setting}>
        <p className={styles.setting_name}>卸载程序</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <Switch checked={showBaseService} onChange={showBaseServiceClick}/><span className={styles.item_label}>显示基础运行服务</span>
          </div>
          <p className={styles.clean_basic} onClick={clearAbandonServiceClick}>清除废弃基础服务</p>
        </div>
      </div>
    </div>
  )
}

export default BasicSetting
