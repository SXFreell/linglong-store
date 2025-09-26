import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'

const MyApplications = ()=>{

  return <div style={{ padding: 20 }}>
    <div className={styles.myApplicationList}>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
    </div>
  </div>
}
export default MyApplications
