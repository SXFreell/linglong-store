import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'

const MyApplications = ()=>{

  return <div style={{ padding: 20 }}>
    <p className={styles.myAppTitle}>我的应用：</p>
    <div className={styles.myApplicationList}>
      <ApplicationCard operateId={0}/>
      <ApplicationCard operateId={0}/>
      <ApplicationCard operateId={0}/>
      <ApplicationCard operateId={0}/>
    </div>
  </div>
}
export default MyApplications
