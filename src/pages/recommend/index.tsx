import { Button } from '@arco-design/web-react'
import AppCarousel from '@/components/ApplicationCarousel'
import ApplicationCard from '@/components/ApplicationCard'
import styles from './index.module.scss'
import { getWelcomeCarouselList, getWelcomeAppList } from '@/apis/apps/index'
import { useEffect, useState } from 'react'
import { useInitStore } from '@/stores/global'
const Recommend = () => {
  const arch = useInitStore((state) => state.arch)
  const repoName = useInitStore((state) => state.repoName)
  useEffect(()=>{
    getCarouselList()
  }, [])
  const [carouselList, setCarouselList] = useState([])
  const [recommendList, setRecommendList] = useState([])
  const getCarouselList = async()=>{
    try {
      const result = await getWelcomeCarouselList({ repoName, arch })
      if (result.code === 200 && result.data.length > 0) {
        setCarouselList(result.data)
        console.log(carouselList, 'carouselList=========')
      }
      const response = await getWelcomeAppList({ repoName, arch, pageNo: 1, pageSize: 10 })
      if (response.code === 200 && response.data.records.length > 0) {
        setRecommendList(response.data.records)
        console.log(recommendList, 'recommendList=========')

      }

    } catch (error) {
      console.log(error, 'error')

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
          {
            recommendList.map(item=>{
              return <ApplicationCard key={item.appId} options={item} operateId={1}/>
            })
          }
        </div>
      </div>
    </main>
  </div>
}

export default Recommend
