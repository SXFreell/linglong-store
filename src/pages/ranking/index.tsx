import { Tabs } from 'antd'
import ApplicationCard from '@/components/ApplicationCard'
import styles from './index.module.scss'
const Ranking = () => {
  const handleTabChange = (key: string) => {
    console.info(key, 'key======')
  }
  return <div style={{ padding: 20 }}>
    <Tabs defaultActiveKey='101' onChange={handleTabChange} className={styles.customTabs}>
      <Tabs.TabPane tab={ <span style={{ fontSize: '1rem' }}>
            最新上架(前100)
      </span>} key='101' />
      <Tabs.TabPane tab={ <span style={{ fontSize: '1rem' }}>
           下载量(前100)
      </span>} key='202' />
    </Tabs>
    <main className={styles.appBox}>
      <div className={styles.appList}>
        <ApplicationCard/>
        <ApplicationCard/>
        <ApplicationCard/>
        <ApplicationCard/>
        <ApplicationCard/>
      </div>
    </main>

  </div>
}

export default Ranking
