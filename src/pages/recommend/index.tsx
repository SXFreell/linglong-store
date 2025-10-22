import { Button } from '@arco-design/web-react'
import AppCarousel from '@/components/ApplicationCarousel'
import ApplicationCard from '@/components/ApplicationCard'
import styles from './index.module.scss'
import { getWelcomeCarouselList, getWelcomeAppList } from '@/apis/apps/index'
import { useCallback, useEffect, useState } from 'react'
import { useInitStore } from '@/stores/global'
import type { CarouselItem } from '@/components/ApplicationCarousel/types'
import type { AppInfo } from '@/apis/apps/types'

const Recommend = () => {
  const arch = useInitStore((state) => state.arch)
  const repoName = useInitStore((state) => state.repoName)

  const [carouselList, setCarouselList] = useState<CarouselItem[]>([])
  const [recommendList, setRecommendList] = useState<AppInfo[]>([])

  const fetchData = useCallback(async() => {
    try {
      // 并行请求，提高性能
      const [carouselResult, recommendResult] = await Promise.all([
        getWelcomeCarouselList({ repoName, arch }),
        getWelcomeAppList({ repoName, arch, pageNo: 1, pageSize: 10 }),
      ])

      // 更新轮播图数据
      if (carouselResult.code === 200 && carouselResult.data?.length > 0) {
        setCarouselList(carouselResult.data)
      }

      // 更新推荐列表数据
      if (recommendResult.code === 200 && recommendResult.data?.records?.length > 0) {
        setRecommendList(recommendResult.data.records)
      }
    } catch (error) {
      console.error('Failed to fetch recommend data:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div style={{ padding: 20 }} className={styles.recommend}>
      <header className={styles.recommendHead}>
        <AppCarousel carouselList={carouselList} />
      </header>
      <main className={styles.recommendMain}>
        <div className={styles.tabBtn}>
          <Button shape='round' type='default' className={styles.btn}>
            全部应用
          </Button>
        </div>
        <div className={styles.appMain}>
          <p className={styles.name}>玲珑推荐</p>
          <div className={styles.appList}>
            {recommendList.map((item) => (
              <ApplicationCard key={item.appId} options={item} operateId={1} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Recommend
