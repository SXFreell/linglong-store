import Myapps from './components/myApp'
import LinglongProcess from './components/linglongProcess'
import styles from './index.module.scss'
import { useState } from 'react'

const MyApplications = () => {
  const [activeKey, setActiveKey] = useState('app')
  const handleChange = (key: string) => {
    if (key === activeKey) {
      return
    }
    setActiveKey(key)
  }
  return <div className={styles.myApplications}>
    <header className={styles.header}>
      <h3 className={[styles.title, activeKey === 'app' ? styles.activeTitle : ''].join(' ')} onClick={() => handleChange('app')}>我的应用</h3>
      <h3 className={[styles.title, activeKey === 'process' ? styles.activeTitle : ''].join(' ')} onClick={() => handleChange('process')}>玲珑进程</h3>
    </header>
    <div className={styles.content} >
      {activeKey === 'app' ? <Myapps /> : <LinglongProcess isTabActive={activeKey === 'process'} />}
    </div>
  </div>
}
export default MyApplications

