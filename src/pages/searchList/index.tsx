import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'

const SearchList = ()=>{

  return <div style={{ padding: 20 }}>
    <div className={styles.SearchList}>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
    </div>
  </div>
}
export default SearchList
