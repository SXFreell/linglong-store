import BaseSetting from './components/baseSetting'
import AboutApp from './components/about'
import styles from './index.module.scss'
import { useState } from 'react'
import { useI18n } from '@/i18n'

const AppSetting = () => {
  const { t } = useI18n()
  const [activeKey, setActiveKey] = useState('setting')

  const handleChange = (key: string) => {
    // 避免重复点击当前标签时触发无意义的状态更新，减少设置页重渲染。
    if (key === activeKey) {
      return
    }
    setActiveKey(key)
  }

  return <div className={styles.appSetting}>
    <header className={styles.header}>
      <h3 className={[styles.title, activeKey === 'setting' ? styles.activeTitle : ''].join(' ')} onClick={() => handleChange('setting')}>{t('setting.tabs.basic')}</h3>
      <h3 className={[styles.title, activeKey === 'about' ? styles.activeTitle : ''].join(' ')} onClick={() => handleChange('about')}>{t('setting.tabs.about')}</h3>
    </header>
    <div className={styles.content} >
      {activeKey === 'setting' ? <BaseSetting /> : <AboutApp />}
    </div>
  </div>
}
export default AppSetting
