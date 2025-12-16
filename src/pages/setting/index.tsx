import { Switch, message } from 'antd'
import styles from './index.module.scss'
import { useConfigStore } from '@/stores/appConfig'
import { useState } from 'react'
import { pruneApps } from '@/apis/invoke'

const BasicSetting = ()=>{
  const checkVersion = useConfigStore((state) => state.checkVersion)
  const closeOrHide = useConfigStore((state) => state.closeOrHide)
  const showBaseService = useConfigStore((state) => state.showBaseService)
  const changeCheckVersionStatus = useConfigStore((state) => state.changeCheckVersionStatus)
  const changeBaseServiceStatus = useConfigStore((state) => state.changeBaseServiceStatus)
  const changeCloseOrHide = useConfigStore((state) => state.changeCloseOrHide)
  const [isHide, setIsHide] = useState(closeOrHide === 'hide')
  const [isPruning, setIsPruning] = useState(false)

  const autoCheckClick = ()=>{
    changeCheckVersionStatus(!checkVersion)
  }
  const showBaseServiceClick = ()=>{
    changeBaseServiceStatus(!showBaseService)
  }
  const clearAbandonServiceClick = async() => {
    if (isPruning) {
      return
    }

    setIsPruning(true)
    try {
      const result = await pruneApps()
      message.success(result || '清理完成')
    } catch (error) {
      message.error(`清理失败: ${error}`)
    } finally {
      setIsPruning(false)
    }
  }
  const handleCloseOrHide = (e:boolean)=>{
    setIsHide(e)
    const newValue = e ? 'hide' : 'close'
    changeCloseOrHide(newValue)
  }

  return (
    <div className={styles.setting} style={{ padding: 20 }}>
      <div className={styles.basic_setting}>
        <p className={styles.setting_name}>基础设置</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <Switch checked={checkVersion} onChange={autoCheckClick}/><span className={styles.item_label}>启动App自动检测商店版本</span>
          </div>
          <div className={styles.content_item}>
            <Switch checked={isHide} onChange={handleCloseOrHide}/><span className={styles.item_label}>关闭App时最小化到托盘</span>
          </div>
        </div>
      </div>
      <div className={styles.remove_setting}>
        <p className={styles.setting_name}>卸载程序</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <Switch checked={showBaseService} onChange={showBaseServiceClick}/><span className={styles.item_label}>显示基础运行服务</span>
          </div>
          <p
            className={`${styles.clean_basic} ${isPruning ? styles.disabled : ''}`}
            onClick={clearAbandonServiceClick}
          >
            {isPruning ? '正在清理...' : '清除废弃基础服务'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default BasicSetting
