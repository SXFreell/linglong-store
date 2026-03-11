import AppCarousel from '@/components/ApplicationCarousel'
import ConnectedApplicationCard from '@/components/ConnectedApplicationCard'
import ApplicationCardSkeleton from '@/components/ApplicationCardSkeleton'
import styles from './index.module.scss'
import { getWelcomeCarouselList, getWelcomeAppList } from '@/apis/apps/index'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useGlobalStore } from '@/stores/global'
import { useCachedPaginatedList } from '@/hooks/useCachedPaginatedList'
import { useKeepAliveVisibility } from '@/hooks/useKeepAliveVisibility'
import { getBestAppListCache, writeRuntimeAppListCache } from '@/services/appListCache'

type AppInfo = API.APP.AppMainDto
const defaultPageSize = 10 // 每页显示数量

const Recommend = () => {
  const arch = useGlobalStore((state) => state.arch)
  const repoName = useGlobalStore((state) => state.repoName)
  const { isVisible } = useKeepAliveVisibility()

  const [carouselList, setCarouselList] = useState<AppInfo[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const carouselCacheDescriptor = useMemo(() => ({
    scope: 'recommend-carousel' as const,
    repoName,
    arch,
  }), [repoName, arch])
  const listCacheDescriptor = useMemo(() => ({
    scope: 'recommend-main' as const,
    repoName,
    arch,
  }), [repoName, arch])

  const fetcher = useCallback(async(pageNo: number) => {
    const res = await getWelcomeAppList({ repoName, arch, pageNo, pageSize: defaultPageSize })
    return { records: (res.data.records || []) as AppInfo[], pages: res.data.pages || 1 }
  }, [repoName, arch])

  const {
    items: recommendList,
    loading,
    initialLoading,
    hasMore,
  } = useCachedPaginatedList<AppInfo>({
    cacheDescriptor: listCacheDescriptor,
    fetcher,
    containerRef: listRef as React.RefObject<HTMLDivElement>,
    pageSize: defaultPageSize,
    enabled: isVisible,
  })

  useEffect(() => {
    const cacheHit = getBestAppListCache(carouselCacheDescriptor)
    if (cacheHit) {
      setCarouselList(cacheHit.snapshot.records as AppInfo[])
      return
    }

    setCarouselList([])
  }, [carouselCacheDescriptor])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    const fetchCarousel = async() => {
      try {
        const result = await getWelcomeCarouselList({ repoName, arch })
        const records = (result.data || []) as AppInfo[]
        setCarouselList(records)
        writeRuntimeAppListCache(carouselCacheDescriptor, {
          updatedAt: new Date().toISOString(),
          pageSize: Math.max(records.length, 1),
          cachedPages: 1,
          totalPages: 1,
          records,
        })
      } catch (error) {
        console.error('Failed to fetch carousel data:', error)
      }
    }

    fetchCarousel()
  }, [arch, carouselCacheDescriptor, isVisible, repoName])

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
            {initialLoading ? (
              <ApplicationCardSkeleton count={defaultPageSize} />
            ) : (
              <>
                {recommendList.map((item, index) => (
                  <ConnectedApplicationCard
                    key={`${item.appId}_${index}`}
                    appInfo={item}
                  />
                ))}
                {loading && <div className={styles.loadingTip}>加载中...</div>}
                {!loading && !hasMore && recommendList.length > 0 && <div className={styles.noMoreTip}>没有更多数据了</div>}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default Recommend
