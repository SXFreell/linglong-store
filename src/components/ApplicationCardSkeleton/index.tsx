import { Skeleton } from 'antd'
import { memo } from 'react'
import styles from './index.module.scss'

type ApplicationCardSkeletonProps = {
  count?: number
}

const ApplicationCardSkeleton = ({ count = 1 }: ApplicationCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div className={styles.applicationCardSkeleton} key={`application-card-skeleton-${index}`} aria-hidden="true">
          <div className={styles.icon}>
            <Skeleton.Avatar active shape="square" size={64} />
          </div>
          <div className={styles.container}>
            <div className={styles.content}>
              <Skeleton.Input active size="small" className={styles.title} />
              <Skeleton.Input active size="small" className={styles.description} />
              <Skeleton.Input active size="small" className={styles.descriptionShort} />
            </div>
            <div className={styles.actions}>
              <Skeleton.Button active size="small" shape="round" className={styles.button} />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default memo(ApplicationCardSkeleton)
