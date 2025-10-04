import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'

const SearchList = ()=>{

  return <div style={{ padding: 20 }}>
    <p className={styles.SearchResult}>搜索结果：</p>
    <div className={styles.SearchList}>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
      <ApplicationCard/>
    </div>
  </div>
}
export default SearchList
