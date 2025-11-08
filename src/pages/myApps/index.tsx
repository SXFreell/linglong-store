import { useEffect, useState, useRef } from 'react'
import { Empty } from 'antd'
import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'
import { useInstalledAppsStore } from '@/stores/installedApps'
import { useConfigStore } from '@/stores/appConfig'
import type { InstalledApp } from '@/apis/invoke/types'

const MyApplications = () => {
  const {
    installedApps,
    // loading,
    error,
    fetchInstalledApps,
  } = useInstalledAppsStore()

  const { showBaseService } = useConfigStore()
  const [mergedApps, setMergedApps] = useState<InstalledApp[]>([])
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // 加载已安装应用列表
    fetchInstalledApps(showBaseService)
  }, [showBaseService, fetchInstalledApps])

  useEffect(() => {
    // 合并同appId的应用（显示最新版本，记录版本数）
    if (installedApps.length > 0) {
      const grouped = installedApps.reduce<Record<string, {
        app: InstalledApp;
        count: number;
        highestVersion: string;
      }>>((acc, app) => {
        const { appId, version } = app

        if (!acc[appId]) {
          acc[appId] = {
            app,
            count: 1,
            highestVersion: version,
          }
        } else {
          acc[appId].count++
          // 简单的版本比较（可以用更复杂的版本比较库）
          if (compareVersions(version, acc[appId].highestVersion) > 0) {
            acc[appId].highestVersion = version
            acc[appId].app = app
          }
        }

        return acc
      }, {})

      const result = Object.values(grouped).map(({ app, count }) => ({
        ...app,
        occurrenceNumber: count,
      }))

      setMergedApps(result)
    } else {
      setMergedApps([])
    }
  }, [installedApps])

  // 简单的版本比较函数
  const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0
      const part2 = parts2[i] || 0

      if (part1 > part2) {
        return 1
      }
      if (part1 < part2) {
        return -1
      }
    }

    return 0
  }

  // const handleUninstall = (_app: InstalledApp) => {
  //   message.info('卸载功能开发中...')
  //   // TODO: 实现卸载逻辑
  // }

  if (error) {
    return (
      <div className={styles.myAppsPage}>
        <div className={styles.applicationList}>
          <Empty description={`加载失败: ${error}`} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.myAppsPage} ref={listRef}>
      <div className={styles.title}>我的应用</div>
      {mergedApps.length > 0 ? <div className={styles.applicationList}>
        {
          mergedApps.map((item, index) => {
            return <ApplicationCard key={`${item.appId}_${index}`} options={item} operateId={0} />
          })
        }
      </div> : <Empty description="暂无已安装应用" />}
    </div>
  )
}

export default MyApplications
