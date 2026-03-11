import { Button, Tooltip, Badge, Space } from 'antd'
import { ReloadOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import styles from './index.module.scss'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
}

interface ProcessToolbarProps {
  /** 运行中进程数量 */
  count: number
  /** 最近成功刷新时间 */
  lastRefreshedAt: Date | null
  /** 静默刷新中 */
  isRefreshing: boolean
  /** 错误信息 */
  error: string | null
  /** 手动刷新回调 */
  onRefresh: () => void
}

const ProcessToolbar: React.FC<ProcessToolbarProps> = ({
  count,
  lastRefreshedAt,
  isRefreshing,
  error,
  onRefresh,
}) => {
  const lastRefreshText = lastRefreshedAt
    ? `上次刷新：${formatTime(lastRefreshedAt)}`
    : '尚未刷新'

  return (
    <div className={styles.toolbar}>
      <Space size={16} align="center">
        <div className={styles.countBadge}>
          <Badge
            count={count}
            showZero
            color="var(--ant-color-primary)"
            overflowCount={99}
          />
          <span className={styles.countLabel}>运行中</span>
        </div>

        <div className={styles.refreshInfo}>
          {isRefreshing ? (
            <span className={styles.refreshing}>
              <LoadingOutlined style={{ marginRight: 4 }} />
              刷新中…
            </span>
          ) : error ? (
            <Tooltip title={error}>
              <span className={styles.refreshError}>刷新失败，自动重试中</span>
            </Tooltip>
          ) : (
            <span className={styles.refreshTime}>
              <CheckCircleOutlined style={{ marginRight: 4, color: 'var(--ant-color-success)' }} />
              {lastRefreshText}
            </span>
          )}
        </div>
      </Space>

      <Tooltip title="手动刷新">
        <Button
          type="text"
          icon={<ReloadOutlined spin={isRefreshing} />}
          onClick={onRefresh}
          disabled={isRefreshing}
          size="small"
        />
      </Tooltip>
    </div>
  )
}

export default ProcessToolbar
