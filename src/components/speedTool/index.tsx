import styles from './index.module.scss'
import { useState, useEffect } from 'react'
import { getNetworkSpeed, type NetworkSpeed } from '@/apis/invoke'

import { Download, Upload } from '@icon-park/react'

const SpeedTool = () => {
  const [networkSpeed, setNetworkSpeed] = useState<NetworkSpeed>({
    upload_speed: 0,
    download_speed: 0,
  })

  // 格式化速度显示
  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) {
      return '0 B/s'
    }

    const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
    let unitIndex = 0
    let speed = bytesPerSecond

    while (speed >= 1024 && unitIndex < units.length - 1) {
      speed /= 1024
      unitIndex++
    }

    return `${speed.toFixed(speed >= 100 ? 0 : 1)} ${units[unitIndex]}`
  }

  // 获取网络速度
  const fetchNetworkSpeed = async() => {
    try {
      const speed = await getNetworkSpeed()
      setNetworkSpeed(speed)
    } catch (error) {
      console.error('获取网络速度失败:', error)
    }
  }

  useEffect(() => {
    // 立即获取一次数据
    fetchNetworkSpeed()

    // 每秒更新一次网络速度
    const interval = setInterval(fetchNetworkSpeed, 1000)

    // 清理定时器
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={styles.speedTool}>
      <div className={styles.speedToolItem}>
        <Download theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>
        <div className={styles.speedToolItemText}>
          <span className={styles.speedToolItemTextTitle}>下载</span>
          <span className={styles.speedToolItemTextValue}>{formatSpeed(networkSpeed.download_speed)}</span>
        </div>
      </div>
      <div className={styles.speedToolItem}>
        <Upload theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>
        <div className={styles.speedToolItemText}>
          <span className={styles.speedToolItemTextTitle}>上传</span>
          <span className={styles.speedToolItemTextValue}>{formatSpeed(networkSpeed.upload_speed)}</span>
        </div>
      </div>
    </div>
  )
}

export default SpeedTool
