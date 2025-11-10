import { Tabs } from 'antd'
import ApplicationCard from '@/components/ApplicationCard'
import { getNewAppList, getInstallAppList } from '@/apis/apps/index'
import { useGlobalStore } from '@/stores/global'
import styles from './index.module.scss'
import { useEffect, useState, useRef } from 'react'
import { generateEmptyCards } from './utils'

const defaultPageSize = 10 // 每页显示数量

type AppInfo = API.APP.AppMainDto
const Ranking = () => {
  const arch = useGlobalStore((state) => state.arch)
  const repoName = useGlobalStore((state) => state.repoName)
  const [activeTab, setActiveTab] = useState('101')
  const listRef = useRef<HTMLDivElement>(null)
  const [RankList, setRankList] = useState<AppInfo[]>([])
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [totalPages, setTotalPages] = useState<number>(1)


  // 获取应用列表函数
  const getRankAppList = ({ pageNo = 1, init = false })=>{
    if (init) {
      // 初始化时先显示空卡片占位
      setRankList(generateEmptyCards(defaultPageSize))
    }
    setLoading(true)
    try {
      switch (activeTab) {
      case '102':
        getNewAppList({
          repoName,
          arch,
          pageNo,
          pageSize: defaultPageSize,
        }).then(res => {
          const newRecords = res.data.records || []
          // 追加新数据时，过滤掉空卡片后再追加
          if (init) {
          // 初始化时直接替换
            setRankList(newRecords)
          } else {
          // 追加新数据时，过滤掉空卡片后再追加
            setRankList(prev => {
              const filteredPrev = prev.filter(item => !item.appId?.startsWith('empty-'))
              return [...filteredPrev, ...newRecords]
            })
          }

          setTotalPages(res.data.pages || 1)
          setLoading(false)
        })
        break

      default:
        getInstallAppList({
          repoName,
          arch,
          pageNo,
          pageSize: defaultPageSize,
        }).then(res => {
          const newRecords = res.data.records || []
          // 追加新数据时，过滤掉空卡片后再追加
          if (init) {
          // 初始化时直接替换
            setRankList(newRecords)
          } else {
          // 追加新数据时，过滤掉空卡片后再追加
            setRankList(prev => {
              const filteredPrev = prev.filter(item => !item.appId?.startsWith('empty-'))
              return [...filteredPrev, ...newRecords]
            })
          }

          setTotalPages(res.data.pages || 1)
          setLoading(false)
        })
        break
      }

    } catch (error) {
      console.error('获取应用列表失败:', error)
      // 错误时移除空卡片
      if (init) {
        setRankList([])
      }
      setLoading(false)
    }
  }
  // tab切换
  const handleTabChange = (key: string) => {
    setActiveTab(key)
    setPageNo(1)
    setRankList([])
    getRankAppList({ init: true })
    console.info(key, 'key======')
  }
  // 初始化获取数据
  useEffect(() => {
    getRankAppList({ init: true })
  }, [])
  // 滚动监听
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
            getRankAppList({ pageNo: pageNo + 1 })
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
  }, [activeTab, pageNo, totalPages, loading])
  return <div className={styles.rankContainer} ref={listRef}>
    <div className={styles.rankHeader}>
      <Tabs defaultActiveKey='101' onChange={handleTabChange} className={styles.customTabs}>
        <Tabs.TabPane tab={ <span style={{ fontSize: '1rem' }}>
            最新上架(前100)
        </span>} key='101' />
        <Tabs.TabPane tab={ <span style={{ fontSize: '1rem' }}>
           下载量(前100)
        </span>} key='202' />
      </Tabs>
    </div>
    <div className={styles.placeholder} />
    <main className={styles.appBox}>
      <div className={styles.appList}>
        {RankList.map((item, index) => (
          <ApplicationCard key={`${item.appId}_${index}`} options={item} operateId={1} />
        ))}
        {loading && <div className={styles.loadingTip}>加载中...</div>}
        {totalPages <= pageNo && RankList.length > 0 && <div className={styles.noMoreTip}>没有更多数据了</div>}
      </div>
    </main>

  </div>
}

export default Ranking
