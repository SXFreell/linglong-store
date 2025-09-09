import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'
const UpdateApp = ()=>{
  return <div style={{ padding: 20 }}>
    <div className={styles.updateApplicationList}>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
    </div>
  </div>
}
export default UpdateApp
