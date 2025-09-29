import styles from './index.module.scss'
import { Button, Image, Typography } from '@arco-design/web-react'
import goBack from '@/assets/icons/go_back.svg'
import { useNavigate } from 'react-router-dom'
const AppDetail = ()=>{
  const navigate = useNavigate()
  const handleGoBack = () => {
    navigate(-1) // 返回上一页
  }
  return <div className={styles.appDetail}>
    <div className={styles.ability}>
      <div className={styles.goBack} onClick={handleGoBack}><img src={goBack} alt="back" /></div>
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
            <div className={[styles.modules, styles.separate].join(' ')}>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            网络应用
              </Typography.Text>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            应用分类
              </Typography.Text>
            </div>
            <div className={[styles.modules, styles.separate].join(' ')}>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            mozixunmozixunmozixunmozixun
              </Typography.Text>
              <Typography.Text ellipsis={{ rows: 1, expandable: false }}>
            开发者
              </Typography.Text>
            </div>
            <div className={[styles.modules, styles.separate].join(' ')}>
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
    <div className={styles.describe}>
      <div className={styles.title}>产品简述</div>
      <div className={styles.content}>微信是一款全方位的通讯应用，帮助你轻松连接全球好友。微信可以群聊、进行视频聊天、与好友一起玩游戏，以及分享自己的生活到朋友圈，让你感受耳目一新的生活方式。
        <br/>本应用在安装时需要管理员权限。</div>
    </div>
    <div className={styles.screenshot}>
      <div className={styles.title}>屏幕截图</div>
      <div className={styles.imgBox}>
        <div className={styles.imgList}>
          {
            [1, 2, 3, 4, 5].map(()=>{
            // eslint-disable-next-line react/jsx-key
              return (<Image
                width={200}
                height={200}
                src={`//p1-arco.byteimg.com/tos-cn-i-uwbnlip3yd/a8c8cdb109cb051163646151a4a5083b.png~tplv-uwbnlip3yd-webp.webp?timestamp=${''}`}
                loader={true}
                alt='应用截图'
                style={{ marginRight: '1rem' }}
              />)
            })
          }
        </div>
      </div>
    </div>
    <div className={styles.version}>
      <div className={styles.title}>版本选择</div>
      <div className={styles.content}>微信是一款全方位的通讯应用，帮助你轻松连接全球好友。微信可以群聊、进行视频聊天、与好友一起玩游戏，以及分享自己的生活到朋友圈，让你感受耳目一新的生活方式。
        <br/>本应用在安装时需要管理员权限。</div>
    </div>
  </div>
}

export default AppDetail
