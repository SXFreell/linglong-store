import styles from './index.module.scss'
import { Button, ConfigProvider } from 'antd'
import { Carousel } from 'antd'
import DefaultIcon from '@/assets/linyaps.svg'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography } from 'antd'

type AppInfo = API.APP.AppMainDto

const Paragraph = Typography.Paragraph

const AppCarousel = ({ carouselList }: { carouselList: AppInfo[] }) => {
  const navigate = useNavigate()
  // 跳转到应用详情页
  const handleNavigateToDetail = useCallback((item: AppInfo) => {
    navigate('/app_detail', {
      state: {
        ...item,
      },
    })
  }, [navigate])

  return (
    <ConfigProvider theme={{
      token: {
        colorBgContainer: 'var(--ant-color-text-tertiary)',
      },
    }}>
      <Carousel
        // autoplay
        arrows={true}
        effect='fade'
        className={styles.carouselBox}
        dots={{ className: styles.carouselDots }}
        dotPosition='bottom'
      >
        {carouselList.map((item) => (
          <div className={styles.carouselItemWrapper} key={item.appId}>
            <div className={styles.carouselItem}>
              <img src={item.icon || DefaultIcon} className={styles.carouselItemIcon} alt={item.name || '应用图标'} />
              <div className={styles.carouselItemContent}>
                <Paragraph ellipsis className={styles.carouselItemName}>{item.zhName || item.name || '应用名称'}</Paragraph>
                <Paragraph ellipsis className={styles.carouselItemSmall}>描述：{item.description || '应用描述'}</Paragraph>
                <Paragraph ellipsis className={styles.carouselItemSmall}>版本：{item.version || '-'}</Paragraph>
                <Paragraph ellipsis className={styles.carouselItemSmall}>分类：{item.categoryName || '分类名称'}</Paragraph>
                <Button type='primary' shape='round' className={styles.installButton} onClick={()=>handleNavigateToDetail(item)}>
                  查看详情
                </Button>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
    </ConfigProvider>
  )
}

export default AppCarousel
