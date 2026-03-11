import styles from './index.module.scss'
import ConnectedApplicationCard from '@/components/ConnectedApplicationCard'
import ApplicationCardSkeleton from '@/components/ApplicationCardSkeleton'
import { useGlobalStore, useSearchStore } from '@/stores/global'
import { getSearchAppList } from '@/apis/apps/index'
import { useEffect, useRef, useCallback } from 'react'
import { Empty } from 'antd'
import { usePaginatedList } from '@/hooks/usePaginatedList'
import { debounce } from '@/utils/performance'
const defaultPageSize = 10 // 每页显示数量

type AppInfo = API.APP.AppMainDto
const SearchList = ()=>{
  const keyword = useSearchStore((state) => state.keyword)
  const arch = useGlobalStore((state) => state.arch)
  const repoName = useGlobalStore((state) => state.repoName)
  const listRef = useRef<HTMLDivElement>(null)

  const fetcher = useCallback(async(pageNo: number) => {
    const res = await getSearchAppList({
      name: keyword,
      repoName,
      arch,
      pageNo,
      pageSize: defaultPageSize,
    })
    return { records: (res.data.records || []) as AppInfo[], pages: res.data.pages || 1 }
  }, [keyword, repoName, arch])

  const {
    items: searchAppList,
    loading,
    initialLoading,
    hasMore,
    loadPage,
    reset,
  } = usePaginatedList<AppInfo>({
    fetcher,
    containerRef: listRef as React.RefObject<HTMLDivElement>,
    pageSize: defaultPageSize,
    extraDeps: [keyword],
  })

  // 关键词变化时防抖搜索（300ms），防止快速切换关键词导致竞态
  const debouncedSearchRef = useRef(debounce((kw: string) => {
    if (!kw) {
      reset()
      return
    }
    loadPage(1, true)
  }, 300))

  useEffect(() => {
    debouncedSearchRef.current(keyword)
    return () => {
      debouncedSearchRef.current.cancel()
    }
  }, [keyword, loadPage, reset])

  return <div className={styles.searchPage} ref={listRef}>
    <p className={styles.SearchResult}>搜索结果：</p>
    <div className={initialLoading || searchAppList.length > 0 ? styles.SearchList : styles.SearchListEmpty}>
      {
        initialLoading ? <ApplicationCardSkeleton count={defaultPageSize} /> : searchAppList.length > 0 ? searchAppList.map((item, index) => (
          <ConnectedApplicationCard
            key={`${item.appId}_${index}`}
            appInfo={item}
          />
        )) : <Empty description="没有搜索到数据哦！"/>
      }
      {!initialLoading && loading && <div className={styles.loadingTip}>加载中...</div>}
      {!initialLoading && !loading && !hasMore && searchAppList.length > 0 && <div className={styles.noMoreTip}>没有更多数据了</div>}
    </div>
  </div>
}
export default SearchList
