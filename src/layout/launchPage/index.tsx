import styles from './index.module.scss'
import Logo from '@/assets/linyaps.svg'

import { useLaunch } from '@/hooks/launch'
import { Progress } from 'antd'

// 首屏页面
const LaunchPage = ()=>{
  const {
    progress,
    currentStep,
  } = useLaunch()

  return <div className={styles.launchPage} >
    <div className={styles.main}>
      <div className={
        styles.logo
      }> <img src={Logo} alt="logo" />   </div>
      <div className={styles.name}>如意玲珑应用商店</div>
      <div className={styles.step}>{currentStep}</div>
      <div className={styles.progress}>
        <Progress percent={progress} showInfo={false} />
      </div>
    </div>
    <div className={styles.footer}>
      <p className={styles.notice}>注意:
      </p>
      <p className={styles.notice}>
        1.刚程序运行时，会检测当前系统是否满足玲珑环境；如果环境不满足则弹出提示，程序不会进入到后续界面；这里需要您手动安装玲珑环境方可使用。
      </p>
      <p className={styles.notice}>
        2.点击安装时，受网速和程序包大小（本体+依赖）的影响，程序安装比较缓慢甚至可能会没反应，此时请耐心等待。
      </p>
      <p className={styles.notice}>
        3.执行操作时，若出现长时间卡住无反应，或者报错提示时，请使用官方命令行方式进行操作，尝试玲珑基础环境组件是否异常，如无异常，请重启商店重试。
      </p>
      <p className={styles.notice}>
        4.如出现特殊现象，请在商店内 [关于程序] - [意见反馈]，进行反馈。
      </p>
    </div>
  </div>
}

export default LaunchPage
