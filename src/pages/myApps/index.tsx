import Myapps from './components/myApp'
import LinglongProcess from './components/linglongProcess'
import styles from './index.module.scss'
import { useState } from 'react'
import { useI18n } from '@/i18n'

const MyApplications = () => {
  const { t } = useI18n()
  const [activeKey, setActiveKey] = useState('app')

  const handleChange = (key: string) => {
    // 标签 key 是状态标识，不和翻译文案耦合，避免语言切换时误触发视图重建。
    if (key === activeKey) {
      return
    }
    setActiveKey(key)
  }
  return <div className={styles.myApplications}>
    <header className={styles.header}>
      <h3 className={[styles.title, activeKey === 'app' ? styles.activeTitle : ''].join(' ')} onClick={() => handleChange('app')}>{t('myApps.tabs.apps')}</h3>
      <h3 className={[styles.title, activeKey === 'process' ? styles.activeTitle : ''].join(' ')} onClick={() => handleChange('process')}>{t('myApps.tabs.processes')}</h3>
    </header>
    <div className={styles.content} >
      {activeKey === 'app' ? <Myapps /> : <LinglongProcess isTabActive={activeKey === 'process'} />}
    </div>
  </div>
}
export default MyApplications
