import { Tabs } from '@arco-design/web-react'
import ApplicationCard from '@/components/ApplicationCard'
import styles from './index.module.scss'
const Ranking = () => {
  const tabClick = (key: string)=>{
    console.log(key, 'key======')

  }
  return <div style={{ padding: 20 }}>
    <Tabs defaultActiveTab='101' onClickTab={tabClick} inkBarSize={{ width: '6.375rem', height: '0.25rem' }} className={styles.customTabs}>
      <Tabs.TabPane key='101' title={ <span style={{ fontSize: '1rem' }}>
            最新上架(前100)
      </span>}/>
      <Tabs.TabPane key='202' title={ <span style={{ fontSize: '1rem' }}>
           下载量(前100)
      </span>} />
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
