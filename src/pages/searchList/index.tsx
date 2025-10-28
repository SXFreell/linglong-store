import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'
import { useInitStore, useSearchStore } from '@/stores/global'
import { getSearchAppList } from '@/apis/apps/index'
import { useState, useEffect, useRef } from 'react'
import { generateEmptyCards } from './utils'
const defaultPageSize = 10 // 每页显示数量

type AppInfo = API.APP.AppMainDto
const SearchList = ()=>{
  const keyword = useSearchStore((state) => state.keyword)
  const arch = useInitStore((state) => state.arch)
  const repoName = useInitStore((state) => state.repoName)
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [searchAppList, setSearchAppList] = useState<AppInfo[]>([])
  const listRef = useRef<HTMLDivElement>(null)
  // 获取应用列表
  const getSearchKeyAppList = ({ pageNo = 1, init = false }) => {
    if (!keyword) {
      return
    }
    setLoading(true)
    if (init) {
      // 初始化时先显示空卡片占位
      setSearchAppList(generateEmptyCards(defaultPageSize))
    }
    try {
      getSearchAppList({
        name: keyword,
        repoName,
        arch,
        pageNo,
        pageSize: defaultPageSize,
      }).then(res => {
        const newRecords = res.data.records || []

        if (init) {
          // 初始化时直接替换
          setSearchAppList(newRecords)
        } else {
          // 追加新数据时，过滤掉空卡片后再追加
          setSearchAppList(prev => {
            const filteredPrev = prev.filter(item => !item.appId?.startsWith('empty-'))
            return [...filteredPrev, ...newRecords]
          })
        }

        setTotalPages(res.data.pages || 1)
        setLoading(false)
      })
    } catch (error) {
      console.error('获取应用列表失败:', error)
      // 错误时移除空卡片
      if (init) {
        setSearchAppList([])
      }
      setLoading(false)
    }
  }

  // 初始化获取数据
  useEffect(() => {
    getSearchKeyAppList({ init: true })
  }, [keyword])

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
            getSearchKeyAppList({ pageNo: pageNo + 1 })
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
  }, [keyword, pageNo, totalPages, loading])
  return <div className={styles.searchPage} ref={listRef}>
    <p className={styles.SearchResult}>搜索结果：</p>
    <div className={styles.SearchList}>
      {
        searchAppList.map((item, index) => {
          return <ApplicationCard key={`${item.appId}_${index}`} options={item} operateId={1} />
        })
      }
      {loading && <div className={styles.loadingTip}>加载中...</div>}
      {!loading && totalPages <= pageNo && searchAppList.length > 0 && <div className={styles.noMoreTip}>没有更多数据了</div>}
    </div>
  </div>
}
export default SearchList
