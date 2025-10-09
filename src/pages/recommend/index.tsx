import { Button } from '@arco-design/web-react'
import AppCarousel from '@/components/ApplicationCarousel'
import ApplicationCard from '@/components/ApplicationCard'
import styles from './index.module.scss'
import { getWelcomeCarouselList } from '@/apis/apps/index'
import { useEffect, useState } from 'react'
import { useConfigStore } from '@/stores/appConfig'
const Recommend = () => {
  const arch = useConfigStore((state) => state.arch)
  useEffect(()=>{
    getCarouselList()
  }, [])
  const [carouselList, setCarouselList] = useState([])
  const getCarouselList = async()=>{
    const result = await getWelcomeCarouselList({ repoName: 'stable', arch })
    if (result.code === 200 && result.data.length > 0) {
      setCarouselList(result.data)
    }
  }
  return <div style={{ padding: 20 }} className={styles.recommend}>
    <header className={styles.recommendHead}>
      <AppCarousel carouselList={carouselList}/>
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
