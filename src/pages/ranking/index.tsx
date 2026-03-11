import { Tabs } from 'antd'
import ConnectedApplicationCard from '@/components/ConnectedApplicationCard'
import ApplicationCardSkeleton from '@/components/ApplicationCardSkeleton'
import { getNewAppList, getInstallAppList } from '@/apis/apps/index'
import { useGlobalStore } from '@/stores/global'
import styles from './index.module.scss'
import { useMemo, useState, useRef, useCallback } from 'react'
import { useCachedPaginatedList } from '@/hooks/useCachedPaginatedList'
import { useKeepAliveVisibility } from '@/hooks/useKeepAliveVisibility'

const defaultPageSize = 10 // 每页显示数量
const NEW_TAB_KEY = 'new'
const INSTALL_TAB_KEY = 'install'

type AppInfo = API.APP.AppMainDto
const Ranking = () => {
  const arch = useGlobalStore((state) => state.arch)
  const repoName = useGlobalStore((state) => state.repoName)
  const { isVisible } = useKeepAliveVisibility()
  const [activeTab, setActiveTab] = useState(NEW_TAB_KEY)
  const listRef = useRef<HTMLDivElement>(null)
  const cacheDescriptor = useMemo(() => ({
    scope: activeTab === NEW_TAB_KEY ? 'ranking-new' as const : 'ranking-install' as const,
    repoName,
    arch,
  }), [activeTab, repoName, arch])

  const fetcher = useCallback(async(pageNo: number) => {
    const params = { repoName, arch, pageNo, pageSize: defaultPageSize }
    const res = activeTab === NEW_TAB_KEY
      ? await getNewAppList(params)
      : await getInstallAppList(params)
    return { records: (res.data.records || []) as AppInfo[], pages: res.data.pages || 1 }
  }, [repoName, arch, activeTab])

  const {
    items: RankList,
    loading,
    initialLoading,
    hasMore,
  } = useCachedPaginatedList<AppInfo>({
    cacheDescriptor,
    fetcher,
    containerRef: listRef as React.RefObject<HTMLDivElement>,
    pageSize: defaultPageSize,
    extraDeps: [activeTab],
    enabled: isVisible,
  })

  // tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
  }

  return <div className={styles.rankContainer} ref={listRef}>
    <div className={styles.rankHeader}>
      <Tabs activeKey={activeTab} onChange={handleTabChange} className={styles.customTabs}>
        <Tabs.TabPane tab={ <span style={{ fontSize: '1rem' }}>
            最新上架(前100)
        </span>} key={NEW_TAB_KEY} />
        <Tabs.TabPane tab={ <span style={{ fontSize: '1rem' }}>
           下载量(前100)
        </span>} key={INSTALL_TAB_KEY} />
      </Tabs>
    </div>
    <div className={styles.placeholder} />
    <main className={styles.appBox}>
      <div className={styles.appList}>
        {initialLoading ? (
          <ApplicationCardSkeleton count={defaultPageSize} />
        ) : (
          <>
            {RankList.map((item, index) => (
              <ConnectedApplicationCard
                key={`${item.appId}_${index}`}
                appInfo={item}
              />
            ))}
            {loading && <div className={styles.loadingTip}>加载中...</div>}
            {!hasMore && RankList.length > 0 && <div className={styles.noMoreTip}>没有更多数据了</div>}
          </>
        )}
      </div>
    </main>

  </div>
}

export default Ranking
