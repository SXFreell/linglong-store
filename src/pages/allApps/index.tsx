import styles from './index.module.scss'
import { Button } from '@arco-design/web-react'
import ApplicationCard from '@/components/ApplicationCard'

const AllApps = () => {
  return <div style={{ padding: 20 }}>
    <div className={styles.tabBtn}>
      {/* <button className={styles.btn}>全部应用</button> */}
      <Button shape='round' type='default' className={styles.btn}>
        全部应用
      </Button>
      <Button shape='round' type='default' className={styles.btn}>
        编程开发
      </Button>
      <Button shape='round' type='default' className={styles.btn}>
        视频播放
      </Button>
      <Button shape='round' type='default' className={styles.btn}>
        教育学习
      </Button>
    </div>
    <div className={styles.applicationList}>
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
    </div>
  </div>
}

export default AllApps
