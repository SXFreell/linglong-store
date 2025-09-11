import styles from './index.module.scss'

import { Carousel } from '@arco-design/web-react'
// const imageSrc = [
//   '1111111', '222222222', '3333333333333',
// ]

function AppCarousel() {
  return (
    <Carousel
      autoPlay
      animation='fade'
      showArrow='never'
      indicatorType='never'
      className={styles.carouselBox}
    >
      <div className={styles.carouselItem}>111111</div>
      <div className={styles.carouselItem}>222222</div>
      <div className={styles.carouselItem}>333333</div>
      <div className={styles.carouselItem}>444444</div>
    </Carousel>
  )
}

export default AppCarousel
