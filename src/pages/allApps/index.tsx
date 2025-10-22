import styles from './index.module.scss'
import { Button } from '@arco-design/web-react'
import ApplicationCard from '@/components/ApplicationCard'
import { useEffect, useState } from 'react'
import { getDisCategoryList, getSearchAppList } from '@/apis/apps/index'
import { useInitStore } from '@/stores/global'
const AllApps = () => {
  const arch = useInitStore((state) => state.arch)
  const repoName = useInitStore((state) => state.repoName)
  const [categoryList, setCategoryList] = useState([])
  const [allAppList, setAllAppList] = useState([])
  // const customCollapseStyle = {
  //   borderRadius: 2,
  //   marginBottom: 24,
  //   border: 'none',
  //   overflow: 'hidden',
  // }
  useEffect(()=>{
    getCategoryList()
    getAllAppList()
  }, [])
  const getCategoryList = async()=>{
    try {
      const result = await getDisCategoryList()
      if (result.code === 200 && result.data.length > 0) {
        setCategoryList(result.data)
      }

    } catch (error) {
      console.log(error, 'error')
    }

  }
  const getAllAppList = async(categoryId = '')=>{
    console.log(categoryId, 'categoryId')

    try {
      const result = await getSearchAppList({ categoryId, repoName, arch, pageNo: 1, pageSize: 50 })
      console.log(result, '所有result')

      if (result.code === 200 && result.data.records.length > 0) {
        setAllAppList(result.data.records)
      }
    } catch (error) {
      console.log(error, 'error')
    }
  }
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
