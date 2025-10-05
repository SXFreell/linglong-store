import styles from './index.module.scss'
import { Button } from '@arco-design/web-react'
import ApplicationCard from '@/components/ApplicationCard'
import { useState } from 'react'

const AllApps = () => {

  const [activeBtn, setActiveBtn] = useState(1)
  const handleClickBtn = (num:number)=>{
    setActiveBtn(num)
  }
  return <div style={{ padding: 20 }}>
    <div className={styles.tabBtn}>
      {/* <button className={styles.btn}>全部应用</button> */}
      <Button shape='round' type={activeBtn === 1 ? 'primary' : 'default'} className={styles.btn} onClick={()=>handleClickBtn(1)}>
        全部应用
      </Button>
      <Button shape='round' type={activeBtn === 2 ? 'primary' : 'default'} className={styles.btn} onClick={()=>handleClickBtn(2)}>
        编程开发
      </Button>
      <Button shape='round' type={activeBtn === 3 ? 'primary' : 'default'} className={styles.btn} onClick={()=>handleClickBtn(3)}>
        视频播放
      </Button>
      <Button shape='round' type={activeBtn === 4 ? 'primary' : 'default'} className={styles.btn} onClick={()=>handleClickBtn(4)}>
        教育学习
      </Button>
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
