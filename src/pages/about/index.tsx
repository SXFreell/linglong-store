import { Descriptions } from 'antd'
import styles from './index.module.scss'
import feedback from '@/assets/icons/feedback.svg'
import update from '@/assets/icons/update.svg'
const AboutSoft = () => {
  const linglong_data = [
    {
      label: '玲珑官网',
      value: 'https://linglong.space/',
    },
    {
      label: '玲珑网页版商店',
      value: 'https://store.linyaps.org.cn/',
    },
    {
      label: '当前共收录玲珑程序数',
      value: '4391个',
    },
  ]
  const version_data = [
    {
      label: '当前商店版本',
      value: '1.3.3',
    },
    {
      label: '当前玲珑组件版本',
      value: '1.7.4',
    },
    {
      label: '开发作者',
      value: 'Jokul<986432015@qq.com>',
    },
    {
      label: '码云地址',
      value: 'https://gitee.com/okul2018/linglong_store',
    },
    {
      label: 'github地址',
      value: 'https://github.com/GershonWang/linglong-store',
    },
  ]
  const checkVersionClick = ()=>{
    console.log('检查版本！！！！！')

  }
  const feedbackClick = ()=>{
    console.log('意见反馈！！！！！')

  }
  return (
    <div style={{ padding: 20 }}>
      <p className={styles.about_app}>关于程序</p>
      <div className={styles.app_info}>
        <Descriptions
          colon=" :"
          layout="inline-horizontal"
          column={1}
          title='玲珑信息'
          data={linglong_data}
          style={{ marginBottom: 10, marginLeft: 10 }}
          labelStyle={{ paddingRight: 10 }}
          className={styles.des_name}
        />
      </div>
      <div className={styles.version_info}>
        <Descriptions
          colon=" :"
          layout="inline-horizontal"
          column={1}
          title='版本信息'
          data={version_data}
          style={{ marginBottom: 10, marginLeft: 10 }}
          labelStyle={{ paddingRight: 10 }}
          className={styles.des_name}
        />
      </div>
      <div className={styles.feedback}>
        <div className={styles.feed} onClick={feedbackClick}>  <img style={{ width: '1.1rem', height: '1.1rem' }} src={feedback} alt="意见反馈" /><span>意见反馈</span></div>
        <div className={styles.checkVersion} onClick={checkVersionClick}><img style={{ width: '1.1rem', height: '1.1rem' }} src={update} alt="检查玲珑版本" /><span>检查玲珑版本</span></div>
      </div>
    </div>
  )
}
export default AboutSoft
