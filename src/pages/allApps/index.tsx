import styles from './index.module.scss'
import { Button } from 'antd'
import { DoubleUp, DoubleDown } from '@icon-park/react'
import ConnectedApplicationCard from '@/components/ConnectedApplicationCard'
import ApplicationCardSkeleton from '@/components/ApplicationCardSkeleton'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { debounce, throttle } from '@/utils/performance'
import { getDisCategoryList, getSearchAppList } from '@/apis/apps/index'
import { useGlobalStore } from '@/stores/global'
import { useCachedPaginatedList } from '@/hooks/useCachedPaginatedList'
import { useKeepAliveVisibility } from '@/hooks/useKeepAliveVisibility'

const defaultPageSize = 30 // 每页显示数量

type Category = API.APP.AppCategories
type AppInfo = API.APP.AppMainDto


const AllApps = () => {
  const arch = useGlobalStore((state) => state.arch)
  const repoName = useGlobalStore((state) => state.repoName)
  const { isVisible } = useKeepAliveVisibility()
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const cacheDescriptor = useMemo(() => ({
    scope: 'all-apps-main' as const,
    repoName,
    arch,
    params: {
      categoryId: activeCategory,
    },
  }), [activeCategory, repoName, arch])

  const fetcher = useCallback(async(pageNo: number) => {
    const res = await getSearchAppList({
      categoryId: activeCategory,
      repoName,
      arch,
      pageNo,
      pageSize: defaultPageSize,
    })
    return { records: (res.data.records || []) as AppInfo[], pages: res.data.pages || 1 }
  }, [activeCategory, repoName, arch])

  const {
    items: allAppList,
    loading,
    initialLoading,
    hasMore,
  } = useCachedPaginatedList<AppInfo>({
    cacheDescriptor,
    fetcher,
    containerRef: listRef as React.RefObject<HTMLDivElement>,
    pageSize: defaultPageSize,
    extraDeps: [activeCategory],
    enabled: isVisible,
  })

  // 获取分类列表
  const getCategoryList = async() => {
    try {
      const result = await getDisCategoryList()
      const categories = [
        {
          id: 'all',
          categoryId: '',
          categoryName: '全部应用',
        } as Category,
        ...(result.data || []),
      ]
      setCategoryList(categories)
    } catch (error) {
      console.error('获取分类列表失败:', error)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    // 立即滚动到顶部
    setTimeout(() => {
      const listElement = listRef.current
      if (listElement) {
        listElement.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 0)

    setActiveCategory(categoryId)
    setTabOpen(true)
  }

  // 设置分类展开或者折叠
  const [tabOpen, setTabOpen] = useState(true)
  const handleTabToggle = () => {
    setTabOpen(tabOpen => !tabOpen)
  }

  // 初始化获取数据
  useEffect(() => {
    getCategoryList()
  }, [])

  // 监听窗口 resize 事件，调整分类栏高度
  const [tabHeight, setTabHeight] = useState(0)
  const [tabTranslateY, setTabTranslateY] = useState(0)
  const tabListRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isVisible) {
      return
    }

    const updateTabHeight = () => {
      const tabListElement = tabListRef.current
      const activeButton = tabListElement?.querySelector<HTMLButtonElement>('button[data-active="true"]')
      // 获取激活的按钮当前高度
      const collapsedHeight = activeButton ? activeButton.offsetTop : 0
      if (tabListElement) {
        const fullHeight = tabListElement.scrollHeight
        setTabHeight(fullHeight + 24) // 高度加上内边距
        setTabTranslateY(collapsedHeight - 8)
      }
    }

    updateTabHeight() // 初始调用一次

    // resize 高频事件防抖，200ms 内合并为一次
    const debouncedUpdate = debounce(updateTabHeight, 200)
    window.addEventListener('resize', debouncedUpdate)
    return () => {
      debouncedUpdate.cancel()
      window.removeEventListener('resize', debouncedUpdate)
    }
  }, [activeCategory, categoryList, isVisible])

  // 监听滚动（用于控制分类栏展开/折叠）
  useEffect(() => {
    if (!isVisible) {
      return
    }

    const handleScroll = () => {
      const listElement = listRef.current
      if (listElement) {
        const { scrollTop } = listElement

        // 滚动到顶部时打开标签栏，否则关闭
        if (scrollTop <= 10) {
          setTabOpen(true)
        } else {
          setTabOpen(false)
        }
      }
    }

    // scroll 高频事件节流，100ms 内最多触发一次
    const throttledScroll = throttle(handleScroll, 100)
    const listElement = listRef.current
    if (listElement) {
      listElement.addEventListener('scroll', throttledScroll)
    }

    return () => {
      throttledScroll.cancel()
      if (listElement) {
        listElement.removeEventListener('scroll', throttledScroll)
      }
    }
  }, [isVisible])

  return <div className={styles.allAppsPage} ref={listRef} >
    <div className={styles.tabBtn} style={{ height: tabOpen ? 'auto' : '3.6em' }}>
      <div className={styles.tabBtnList} ref={tabListRef} style={{ transform: tabOpen ? 'none' : `translateY(-${tabTranslateY}px)` }}>
        {categoryList.map(item=>{
          return <Button
            shape='round'
            type={activeCategory === item.categoryId ? 'primary' : 'default'}
            key={item.id}
            data-active={activeCategory === item.categoryId}
            className={styles.btn}
            onClick={()=>handleCategoryChange(item.categoryId)}
          >
            {item.categoryName}
          </Button>
        })}
      </div>
      <div className={styles.tabShrink} onClick={handleTabToggle}>{tabOpen ? <DoubleUp theme="outline" size="16" fill="#333"/> : <DoubleDown theme="outline" size="16" fill="#333"/>}</div>
    </div>
    <div className={styles.applicationList} style={{ marginTop: `${tabHeight}px` }}>
      {initialLoading ? (
        <ApplicationCardSkeleton count={defaultPageSize} />
      ) : (
        <>
          {
            allAppList.map((item, index) => (
              <ConnectedApplicationCard
                key={`${item.appId}_${index}`}
                appInfo={item}
              />
            ))
          }
          {loading && <div className={styles.loadingTip}>加载中...</div>}
          {!hasMore && allAppList.length > 0 && <div className={styles.noMoreTip}>没有更多数据了</div>}
        </>
      )}
    </div>
  </div>
}

export default AllApps
