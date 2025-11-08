import AppCarousel from '@/components/ApplicationCarousel'
import ApplicationCard from '@/components/ApplicationCard'
import styles from './index.module.scss'
import { getWelcomeCarouselList, getWelcomeAppList } from '@/apis/apps/index'
import { useCallback, useEffect, useState, useRef } from 'react'
import { useInitStore } from '@/stores/global'
import { generateEmptyCards } from './utils'

type AppInfo = API.APP.AppMainDto
const defaultPageSize = 10 // 每页显示数量

const Recommend = () => {
  const arch = useInitStore((state) => state.arch)
  const repoName = useInitStore((state) => state.repoName)

  const [carouselList, setCarouselList] = useState<AppInfo[]>([])
  const [recommendList, setRecommendList] = useState<AppInfo[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [totalPages, setTotalPages] = useState<number>(1)
  const fetchData = useCallback(async() => {
    try {
      // 设置初始化的空卡片
      setRecommendList(generateEmptyCards(defaultPageSize))
      setCarouselList(generateEmptyCards(5))
      // 并行请求，提高性能
      const [carouselResult, recommendResult] = await Promise.all([
        getWelcomeCarouselList({ repoName, arch }),
        getWelcomeAppList({ repoName, arch, pageNo: 1, pageSize: defaultPageSize }),
      ])

      // 更新轮播图数据
      if (carouselResult.code === 200 && carouselResult.data?.length > 0) {
        setCarouselList(carouselResult.data as AppInfo[])
      }

      // 更新推荐列表数据
      if (recommendResult.code === 200 && recommendResult.data?.records?.length > 0) {
        setRecommendList(recommendResult.data.records as AppInfo[])
        setTotalPages(recommendResult.data.pages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch recommend data:', error)
    }
  }, [repoName, arch])
  // 获取推荐数据函数
  const getWelcomeAppListNext = ({ pageNo = 1 })=>{
    setLoading(true)
    try {
      getWelcomeAppList({
        repoName,
        arch,
        pageNo,
        pageSize: defaultPageSize,
      }).then(res => {
        const newRecords = res.data.records || []
        // 追加新数据时，过滤掉空卡片后再追加
        setRecommendList(prev => {
          const filteredPrev = prev.filter(item => !item.appId?.startsWith('empty-'))
          return [...filteredPrev, ...newRecords]
        })

        setTotalPages(res.data.pages || 1)
        setLoading(false)
      })
    } catch (error) {
      console.error('获取应用列表失败:', error)
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchData()
  }, [fetchData])
  // 滚动刷新推荐
  useEffect(() => {
    const handleScroll = () => {
      if (loading) {
        return
      }
      const listElement = listRef.current
      if (listElement) {
        const { scrollTop, scrollHeight, clientHeight } = listElement
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          if (pageNo < totalPages) {
            setPageNo(pageNo + 1)
            getWelcomeAppListNext({ pageNo: pageNo + 1 })
          }
        }
      }
    }

    const listElement = listRef.current
    if (listElement) {
      listElement.addEventListener('scroll', handleScroll)
    }

    return () => {
      if (listElement) {
        listElement.removeEventListener('scroll', handleScroll)
      }
    }
  }, [pageNo, totalPages, loading])
  return (
    <div className={styles.recommend} ref={listRef} >
      <header className={styles.recommendHead}>
        <AppCarousel carouselList={carouselList} />
      </header>
      <main className={styles.recommendMain}>
        {/* <div className={styles.tabBtn}>
          <Button shape='round' type='default' className={styles.btn}>
            全部应用
          </Button>
        </div> */}
        <div className={styles.appMain}>
          <p className={styles.name}>玲珑推荐</p>
          <div className={styles.appList}>
            {recommendList.map((item, index) => (
              <ApplicationCard key={`${item.appId}_${index}`} options={item} operateId={1} />
            ))}
            {loading && <div className={styles.loadingTip}>加载中...</div>}
            {totalPages <= pageNo && recommendList.length > 0 && <div className={styles.noMoreTip}>没有更多数据了</div>}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Recommend
