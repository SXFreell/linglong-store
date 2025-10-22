import styles from './index.module.scss'
import { Button } from '@arco-design/web-react'
import ApplicationCard from '@/components/ApplicationCard'
import { useCallback, useEffect, useState } from 'react'
import { getDisCategoryList, getSearchAppList } from '@/apis/apps/index'
import { useInitStore } from '@/stores/global'
import type { Category, AppInfo } from '@/apis/apps/types'

const AllApps = () => {
  const arch = useInitStore((state) => state.arch)
  const repoName = useInitStore((state) => state.repoName)
  const [categoryList, setCategoryList] = useState<Category[]>([])
  const [allAppList, setAllAppList] = useState<AppInfo[]>([])
  // const customCollapseStyle = {
  //   borderRadius: 2,
  //   marginBottom: 24,
  //   border: 'none',
  //   overflow: 'hidden',
  // }

  const getCategoryList = useCallback(async() => {
    try {
      const result = await getDisCategoryList()
      if (result.code === 200 && result.data.length > 0) {
        setCategoryList(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }, [])

  const getAllAppList = useCallback(async(categoryId = '') => {
    try {
      // 使用闭包捕获当前的 arch 和 repoName 值
      const result = await getSearchAppList({ categoryId, repoName, arch, pageNo: 1, pageSize: 50 })
      if (result.code === 200 && result.data.records.length > 0) {
        setAllAppList(result.data.records)
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    getCategoryList()
    getAllAppList()
  }, [getCategoryList, getAllAppList])

  const [activeBtn, setActiveBtn] = useState<string>('')
  const handleClickBtn = (num:string)=>{
    setActiveBtn(num)
    getAllAppList(num)
  }
  return <div style={{ padding: 20 }}>
    <div className={styles.tabBtn}>
      {/* <Collapse accordion bordered={false}>
        <Collapse.Item header={<Button shape='round' type={activeBtn === '' ? 'primary' : 'default'} className={styles.btn} onClick={()=>handleClickBtn('')}>
        全部应用
        </Button>} name='1' style={customCollapseStyle}>
          {categoryList.map(item=>{
            return <Button shape='round' type={activeBtn === item.categoryId ? 'primary' : 'default'} key={item.id} className={styles.btn} onClick={()=>handleClickBtn(item.categoryId)}>
              {item.categoryName}
            </Button>

          })}
        </Collapse.Item>
      </Collapse> */}
      <Button shape='round' type={activeBtn === '' ? 'primary' : 'default'} className={styles.btn} onClick={()=>handleClickBtn('')}>
        全部应用
      </Button>
      {categoryList.map(item=>{
        return <Button shape='round' type={activeBtn === item.categoryId ? 'primary' : 'default'} key={item.id} className={styles.btn} onClick={()=>handleClickBtn(item.categoryId)}>
          {item.categoryName}
        </Button>
      })}
    </div>
    <div className={styles.applicationList}>
      {
        allAppList.map(item=>{
          return <ApplicationCard key={item.appId} options={item} operateId={1}/>
        })
      }
    </div>
  </div>
}

export default AllApps
