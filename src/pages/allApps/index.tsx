import styles from './index.module.scss'
import { Button } from 'antd'
import { DoubleUp, DoubleDown } from '@icon-park/react'
import ApplicationCard from '@/components/ApplicationCard'
import { useEffect, useState, useRef } from 'react'
import { getDisCategoryList, getSearchAppList } from '@/apis/apps/index'
import { useInitStore } from '@/stores/global'
import { generateEmptyCards, generateEmptyCategories } from './utils'

const defaultPageSize = 30 // 每页显示数量
const defaultCategorySize = 22 // 默认分类数量

type Category = API.APP.AppCategories
type AppInfo = API.APP.AppMainDto


const AllApps = () => {
  const arch = useInitStore((state) => state.arch)
  const repoName = useInitStore((state) => state.repoName)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [pageNo, setPageNo] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [totalPages, setTotalPages] = useState<number>(1)
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [allAppList, setAllAppList] = useState<AppInfo[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  // 获取分类列表
  const getCategoryList = async() => {
    setCategoryList(generateEmptyCategories(defaultCategorySize))
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

  // 获取应用列表
  const getAllAppList = ({ categoryId = '', pageNo = 1, init = false }) => {
    setLoading(true)

    if (init) {
      // 初始化时先显示空卡片占位
      setAllAppList(generateEmptyCards(defaultPageSize))
    }
    try {
      getSearchAppList({
        categoryId,
        repoName,
        arch,
        pageNo,
        pageSize: defaultPageSize,
      }).then(res => {
        const newRecords = res.data.records || []

        if (init) {
          // 初始化时直接替换
          setAllAppList(newRecords)
        } else {
          // 追加新数据时，过滤掉空卡片后再追加
          setAllAppList(prev => {
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
        setAllAppList([])
      }
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    // 立即滚动到顶部（异步以确保 DOM 已更新）
    setTimeout(() => {
      const listElement = listRef.current
      if (listElement) {
        listElement.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }, 0)

    setActiveCategory(categoryId)
    setPageNo(1)
    getAllAppList({ categoryId, init: true })
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
    getAllAppList({ init: true })
  }, [])

  // 监听窗口 resize 事件，调整分类栏高度
  const [tabHeight, setTabHeight] = useState(0)
  const [tabTranslateY, setTabTranslateY] = useState(0)
  const tabListRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
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

    window.addEventListener('resize', updateTabHeight)
    return () => {
      window.removeEventListener('resize', updateTabHeight)
    }
  }, [categoryList, activeCategory])

  // 监听滚动
  useEffect(() => {
    const handleScroll = () => {
      if (loading) {
        return
      }
      const listElement = listRef.current
      if (listElement) {
        const { scrollTop, scrollHeight, clientHeight } = listElement

        // 滚动到顶部时打开标签栏，否则关闭
        if (scrollTop <= 10) {
          setTabOpen(true)
        } else {
          setTabOpen(false)
        }

        // 滚动到底部时加载更多
        if (scrollTop + clientHeight >= scrollHeight - 100) {
          if (pageNo < totalPages) {
            setPageNo(pageNo + 1)
            getAllAppList({ categoryId: activeCategory, pageNo: pageNo + 1 })
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
  }, [activeCategory, pageNo, totalPages, loading])

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
      {
        allAppList.map((item, index) => {
          return <ApplicationCard key={`${item.appId}_${index}`} options={item} operateId={1} />
        })
      }
      {loading && <div className={styles.loadingTip}>加载中...</div>}
      {totalPages <= pageNo && allAppList.length > 0 && <div className={styles.noMoreTip}>没有更多数据了</div>}
    </div>
  </div>
}

export default AllApps
