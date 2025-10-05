import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'
const UpdateApp = ()=>{
  return <div style={{ padding: 20 }}>
    <p className={styles.updateAppTitle}>更新应用：</p>
    <div className={styles.updateApplicationList}>
      <ApplicationCard operateId={2}/>
      <ApplicationCard operateId={2}/>
      <ApplicationCard operateId={2}/>
      <ApplicationCard operateId={2}/>
      <ApplicationCard operateId={2}/>
    </div>
  </div>
}
export default UpdateApp
