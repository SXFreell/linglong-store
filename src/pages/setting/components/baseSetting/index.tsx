import { Select, Switch, message } from 'antd'
import styles from './index.module.scss'
import { useConfigStore } from '@/stores/appConfig'
import { useState } from 'react'
import { pruneApps } from '@/apis/invoke'
import { useI18n } from '@/i18n'

const BasicSetting = ()=>{
  const { t } = useI18n()
  const checkVersion = useConfigStore((state) => state.checkVersion)
  const showBaseService = useConfigStore((state) => state.showBaseService)
  const languagePreference = useConfigStore((state) => state.languagePreference)
  const changeCheckVersionStatus = useConfigStore((state) => state.changeCheckVersionStatus)
  const changeBaseServiceStatus = useConfigStore((state) => state.changeBaseServiceStatus)
  const changeLanguagePreference = useConfigStore((state) => state.changeLanguagePreference)
  const [isPruning, setIsPruning] = useState(false)

  const autoCheckClick = ()=>{
    changeCheckVersionStatus(!checkVersion)
  }
  const showBaseServiceClick = ()=>{
    changeBaseServiceStatus(!showBaseService)
  }
  const clearAbandonServiceClick = async() => {
    // 玲珑基础服务清理是有副作用的操作，这里显式阻止重复触发，避免并发调用。
    if (isPruning) {
      return
    }

    setIsPruning(true)
    try {
      const result = await pruneApps()
      message.success(result || t('setting.basic.pruneSuccessFallback'))
    } catch (error) {
      message.error(t('setting.basic.pruneFailed', { error: String(error) }))
    } finally {
      setIsPruning(false)
    }
  }
  return (
    <div className={styles.setting} style={{ padding: 20 }}>
      <div className={styles.basic_setting}>
        <p className={styles.setting_name}>{t('setting.basic.sectionTitle')}</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <Switch checked={checkVersion} onChange={autoCheckClick}/><span className={styles.item_label}>{t('setting.basic.autoCheckVersion')}</span>
          </div>
        </div>
      </div>
      <div className={styles.basic_setting}>
        <p className={styles.setting_name}>{t('setting.basic.languageSectionTitle')}</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <span className={styles.item_label} style={{ marginLeft: 0, marginRight: 14 }}>
              {t('setting.basic.languageLabel')}
            </span>
            <Select
              value={languagePreference}
              style={{ width: 220 }}
              // 设置页只维护“语言偏好”的选择；真正的语言解析和资源切换由全局 i18n 层统一处理。
              onChange={(value: Store.LanguagePreference) => changeLanguagePreference(value)}
              options={[
                { value: 'system', label: t('common.languagePreference.system') },
                { value: 'zh-CN', label: t('common.languagePreference.zhCN') },
                { value: 'en-US', label: t('common.languagePreference.enUS') },
              ]}
            />
          </div>
          <p style={{ marginTop: -8, maxWidth: '38rem', color: 'var(--ant-color-text-secondary)' }}>
            {t('setting.basic.languageHint')}
          </p>
        </div>
      </div>
      <div className={styles.remove_setting}>
        <p className={styles.setting_name}>{t('setting.basic.maintenanceTitle')}</p>
        <div className={styles.setting_content}>
          <div className={styles.content_item}>
            <Switch checked={showBaseService} onChange={showBaseServiceClick}/><span className={styles.item_label}>{t('setting.basic.showBaseService')}</span>
          </div>
          <p
            className={`${styles.clean_basic} ${isPruning ? styles.disabled : ''}`}
            onClick={clearAbandonServiceClick}
          >
            {isPruning ? t('setting.basic.pruning') : t('setting.basic.prune')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default BasicSetting
