import styles from './index.module.scss'
import { Button } from '@arco-design/web-react'
import ApplicationCard from '@/components/ApplicationCard'
import { useEffect, useState } from 'react'
import { getDisCategoryList } from '@/apis/apps/index'
const AllApps = () => {
  const [categoryList, setCategoryList] = useState([])
  useEffect(()=>{
    getCategoryList()
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
  const [activeBtn, setActiveBtn] = useState(1)
  const handleClickBtn = (num:number)=>{
    setActiveBtn(num)
  }
  return <div style={{ padding: 20 }}>
    <div className={styles.tabBtn}>
      <Button shape='round' type={activeBtn === 1 ? 'primary' : 'default'} className={styles.btn} onClick={()=>handleClickBtn(1)}>
        全部应用
      </Button>
      {categoryList.map(item=>{
        return <Button shape='round' type={activeBtn === item.id ? 'primary' : 'default'} key={item.id} className={styles.btn} onClick={()=>handleClickBtn(item.id)}>
          {item.categoryName}
        </Button>
      })}
    </div>
    <div className={styles.applicationList}>
      <ApplicationCard operateId={1}/>
      <ApplicationCard operateId={1}/>
      <ApplicationCard operateId={1}/>
      <ApplicationCard operateId={1}/>
      <ApplicationCard operateId={1}/>
      <ApplicationCard operateId={1}/>
      <ApplicationCard operateId={1}/>
    </div>
  </div>
}

export default AllApps
