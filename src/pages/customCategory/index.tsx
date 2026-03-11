import styles from './index.module.scss'
import ConnectedApplicationCard from '@/components/ConnectedApplicationCard'
import ApplicationCardSkeleton from '@/components/ApplicationCardSkeleton'
import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { getAppListByCategoryIds, getRecommendAppList } from '@/apis/apps/index'
import { useGlobalStore } from '@/stores/global'
import { Select, Checkbox, Empty, type CheckboxProps } from 'antd'
import { useParams } from 'react-router-dom'
import { useCachedPaginatedList } from '@/hooks/useCachedPaginatedList'
import { useKeepAliveVisibility } from '@/hooks/useKeepAliveVisibility'
import { getBestAppListCache, writeRuntimeAppListCache } from '@/services/appListCache'
const defaultPageSize = 30 // 每页显示数量
type AppInfo = API.APP.AppMainDto
const OfficeApps = () => {
  const { arch, repoName, customMenuCategory } = useGlobalStore()
  const { isVisible } = useKeepAliveVisibility()
  const [recommendAppList, setRecommendAppList] = useState<AppInfo[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  const { code } = useParams()
  const currentCategory = customMenuCategory.find(item => item.code === code)
  const categoryIds = currentCategory?.categoryIds ?? []
  const name = currentCategory?.name ?? ''
  const [filter, setFilter] = useState<boolean>(false) // 是否过滤低分应用
  const [sortType, setSortType] = useState<string>('createTime') // 排序类型
  const recommendCacheDescriptor = useMemo(() => ({
    scope: 'custom-category-recommend' as const,
    repoName,
    arch,
    params: {
      menuCode: code || '',
      categoryId: categoryIds.join(','),
    },
  }), [arch, categoryIds, code, repoName])
  const listCacheDescriptor = useMemo(() => ({
    scope: 'custom-category-main' as const,
    repoName,
    arch,
    params: {
      menuCode: code || '',
      filter,
      sortType,
    },
  }), [arch, code, filter, repoName, sortType])

  // 处理过滤低分应用的change事件
  const handleFilterChange:CheckboxProps['onChange'] = (e) => {
    setFilter(e.target.checked)
  }
  // 处理排序类型的change事件
  const handleSortTypeChange = (value: string) => {
    setSortType(value)
  }

  const fetcher = useCallback(async(pageNo: number) => {
    const res = await getAppListByCategoryIds({
      menuCode: code,
      repoName,
      arch,
      filter,
      sortType,
      pageNo,
      pageSize: defaultPageSize,
    })
    return { records: (res.data.records || []) as AppInfo[], pages: res.data.pages || 1 }
  }, [code, repoName, arch, filter, sortType])

  const {
    items: allAppList,
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
    const cacheHit = getBestAppListCache(recommendCacheDescriptor)
    if (cacheHit) {
      setRecommendAppList(cacheHit.snapshot.records as AppInfo[])
      return
    }

    setRecommendAppList([])
  }, [recommendCacheDescriptor])

  useEffect(() => {
    if (!isVisible) {
      return
    }

    if (categoryIds.length === 0) {
      setRecommendAppList([])
      return
    }

    const getHeaderRecommendAppList = async() => {
      const params = {
        repoName,
        arch,
        pageNo: 1,
        pageSize: 5,
        categoryId: categoryIds.join(','),
      }
      try {
        const res = await getRecommendAppList(params)
        const records = (res.data || []) as AppInfo[]
        setRecommendAppList(records)
        writeRuntimeAppListCache(recommendCacheDescriptor, {
          updatedAt: new Date().toISOString(),
          pageSize: Math.max(records.length, 1),
          cachedPages: 1,
          totalPages: 1,
          records,
        })
      } catch (error) {
        console.error('获取推荐应用列表失败:', error)
      }
    }

    getHeaderRecommendAppList().catch(() => undefined)
  }, [arch, categoryIds, isVisible, recommendCacheDescriptor, repoName])

  return <div className={styles.officeAppsPage} ref={listRef} >
    <div className={styles.search} >
      <h3>{name}</h3>
      <div className={styles.searchBox}>
        <Select
          defaultValue={sortType}
          style={{ minWidth: '5rem', maxWidth: '20rem', flex: 1 }}
          onChange={handleSortTypeChange}
          options={[
            { value: 'createTime', label: '按上架时间排序' },
            { value: 'installCount', label: '按安装量排序' },
            { value: 'last30Downloads', label: '按近30天下载量排序' },
          ]}
        />
        <Checkbox checked={filter}
          onChange={handleFilterChange}>过滤低分应用</Checkbox>
      </div>
    </div>
    <div className={styles.recommendApplicationList} style={{ marginTop: !initialLoading && recommendAppList.length > 0 ? '3rem' : 0 }}>
      {
        !initialLoading && recommendAppList.map((item, index) => (
          index < 3 && (
            <ConnectedApplicationCard
              type="recommend"
              key={`${item.appId}_${index}`}
              appInfo={item}
            />
          )
        ))
      }
    </div>
    <div className={styles.applicationList}>
      {initialLoading ? (
        <ApplicationCardSkeleton count={defaultPageSize} />
      ) : allAppList.length > 0 ? (
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
          {!loading && !hasMore && <div className={styles.noMoreTip}>没有更多数据了</div>}
        </>
      ) : (
        <div className={styles.emptyState}>
          <Empty description="查无数据" image={null} />
        </div>
      )}
    </div>
  </div>
}

export default OfficeApps
