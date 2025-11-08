import styles from './index.module.scss'
import { Button } from 'antd'
import { Carousel } from 'antd'
import DefaultIcon from '@/assets/linyaps.svg'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

type AppInfo = API.APP.AppMainDto

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
    <Carousel
      autoplay
      effect='fade'
      className={styles.carouselBox}
      dotPosition='bottom'
    >
      {carouselList.map((item) => (
        <div className={styles.carouselItem} key={item.appId}>
          <img src={item.icon || DefaultIcon} className={styles.carouselItemIcon} alt={item.name || '应用图标'} />
          <div className={styles.carouselItemContent}>
            <p className={styles.carouselItemName}>{item.zhName || item.name || '应用名称'}</p>
            <p className={styles.carouselItemSmall}>描述：{item.description || '应用描述'}</p>
            <p className={styles.carouselItemSmall}>版本：{item.version || '-'}</p>
            <p className={styles.carouselItemSmall}>分类：{item.categoryName || '分类名称'}</p>
            <Button type='primary' shape='round' className={styles.installButton} onClick={()=>handleNavigateToDetail(item)}>
              查看详情
            </Button>
          </div>
        </div>
      ))}
    </Carousel>
  )
}

export default AppCarousel
