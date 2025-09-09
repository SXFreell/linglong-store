import { Button } from '@arco-design/web-react'
import AppCarousel from '@/components/ApplicationCarousel'
import ApplicationCard from '@/components/ApplicationCard'
import styles from './index.module.scss'
const Recommend = () => {
  return <div style={{ padding: 20 }} className={styles.recommend}>
    <header className={styles.recommendHead}>
      <AppCarousel />
    </header>
    <main className={styles.recommendMain}>
      <div className={styles.tabBtn}>
        {/* <button className={styles.btn}>全部应用</button> */}
        <Button shape='round' type='default' className={styles.btn}>
        全部应用
        </Button>
      </div>
      <div className={styles.appMain}>
        <p className={styles.name}>玲珑推荐</p>
        <div className={styles.appList}>
          <ApplicationCard />
          <ApplicationCard />
          <ApplicationCard />
          <ApplicationCard />
          <ApplicationCard />
        </div>
      </div>
    </main>
  </div>
}

export default Recommend
