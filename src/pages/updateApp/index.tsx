import { Spin, Empty, Badge, message } from 'antd'
import styles from './index.module.scss'
import ApplicationCard from '@/components/ApplicationCard'
import { useInstalledAppsStore } from '@/stores/installedApps'
import type { InstalledApp } from '@/apis/invoke/types'
const UpdateApp = ()=>{
  const {
    error,
    loading,
    needUpdateApps,
  } = useInstalledAppsStore()

  const handleUpdateApp = (_app: InstalledApp) => {
    message.info('更新功能开发中...')
    // TODO: 实现更新逻辑
  }
  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <p className={styles.myAppTitle}>我的应用：</p>
        <Empty description={`加载失败: ${error}`} />
      </div>
    )
  }
  return <div style={{ padding: 20 }}>
    <p className={styles.updateAppTitle}>更新应用：</p>
    <Spin spinning={loading} style={{ display: 'block' }}>
      { needUpdateApps.length > 0 ? (
        <div className={styles.updateApplicationList}>
          {needUpdateApps.map((app, index) => (
            <Badge
              className={styles.badgeBox}
              key={`${app.appId}-${index}`}
              count={app.occurrenceNumber && app.occurrenceNumber > 1 ? app.occurrenceNumber : 0}
              overflowCount={99}
            >
              <ApplicationCard
                operateId={2}
                options={app as Partial<InstalledApp> & Record<string, unknown>}
                loading={app.loading}
                onOperate={() => handleUpdateApp(app)}
              />
            </Badge>
          ))}
        </div>) : (
        <Empty description="暂无需更新应用" />
      )}
    </Spin>
  </div>
}
export default UpdateApp
