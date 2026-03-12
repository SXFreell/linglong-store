import styles from './index.module.scss'
import { Button, ConfigProvider } from 'antd'
import { Carousel } from 'antd'
import DefaultIcon from '@/assets/linyaps.svg'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Typography } from 'antd'
import { useI18n } from '@/i18n'

type AppInfo = API.APP.AppMainDto

const Paragraph = Typography.Paragraph

const AppCarousel = ({ carouselList }: { carouselList: AppInfo[] }) => {
  const navigate = useNavigate()
  const { t } = useI18n()
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
              <img src={item.icon || DefaultIcon} className={styles.carouselItemIcon} alt={item.name || t('carousel.defaultIconAlt')} />
              <div className={styles.carouselItemContent}>
                <Paragraph ellipsis className={styles.carouselItemName}>{item.zhName || item.name || t('carousel.defaultAppName')}</Paragraph>
                <Paragraph ellipsis className={styles.carouselItemSmall}>{t('carousel.descriptionLabel')}{item.description || t('carousel.defaultDescription')}</Paragraph>
                <Paragraph ellipsis className={styles.carouselItemSmall}>{t('carousel.versionLabel')}{item.version || '-'}</Paragraph>
                <Paragraph ellipsis className={styles.carouselItemSmall}>{t('carousel.categoryLabel')}{item.categoryName || t('carousel.defaultCategory')}</Paragraph>
                <Button type='primary' size="small" shape='round' className={styles.installButton} onClick={()=>handleNavigateToDetail(item)}>
                  {t('carousel.viewDetail')}
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
