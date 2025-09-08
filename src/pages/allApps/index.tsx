import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'

const AllApps = () => {
  return <div style={{ padding: 20 }}>
    <div className={styles.applicationList}>
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
      <ApplicationCard />
    </div>
  </div>
}

export default AllApps
