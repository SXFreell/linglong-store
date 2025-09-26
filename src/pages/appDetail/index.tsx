import styles from './index.module.scss'
import { Button, Typography } from '@arco-design/web-react'
import goBack from '@/assets/icons/go_back.svg'
const AppDetail = ()=>{
  return <div className={styles.appDetail}>
    <div className={styles.ability}>
      <div className={styles.goBack}><img src={goBack} alt="back" /></div>
      <div className={styles.application}>
        <div className={styles.appLeft}>
          <div className={styles.icon}>
        Icon
          </div>
        </div>
        <div className={styles.appRight}>
          <div className={styles.appName}>
            <div className={styles.head}>
              <p className={styles.nameId}>微信</p>
              <p className={styles.appClass}>社交通讯软件</p>
            </div>
            <div className={styles.install}>
              <Button type='primary' shape='round' className={styles.installButton} size='default'>安 装</Button>
              <p className={styles.history}>安装历史版本</p>
            </div>
          </div>
          <div className={styles.appDesc}>
            <div className={styles.modules}>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            网络应用
              </Typography.Text>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            应用分类
              </Typography.Text>
            </div>
            <div className={styles.modules}>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            mozixunmozixunmozixunmozixun
              </Typography.Text>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            开发者
              </Typography.Text>
            </div>
            <div className={styles.modules}>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            mozixun
              </Typography.Text>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            维护者
              </Typography.Text>

            </div>
            <div className={styles.modules}>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            com.tencent.wechat
              </Typography.Text>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            appld
              </Typography.Text>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className={styles.describe}>描述</div>
    <div className={styles.screenshot}>截图</div>
    <div className={styles.version}>版本</div>
  </div>
}

export default AppDetail
