import { Button, Tooltip, Badge, Space } from 'antd'
import { ReloadOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons'
import styles from './index.module.scss'
import { useI18n } from '@/i18n'

function formatTime(date: Date, locale: string): string {
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
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
  const { t, locale } = useI18n()
  const lastRefreshText = lastRefreshedAt
    ? t('process.toolbar.lastRefreshed', { time: formatTime(lastRefreshedAt, locale) })
    : t('process.toolbar.notRefreshedYet')

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
          <span className={styles.countLabel}>{t('process.toolbar.runningCountLabel')}</span>
        </div>

        <div className={styles.refreshInfo}>
          {isRefreshing ? (
            <span className={styles.refreshing}>
              <LoadingOutlined style={{ marginRight: 4 }} />
              {t('process.toolbar.refreshing')}
            </span>
          ) : error ? (
            <Tooltip title={error}>
              <span className={styles.refreshError}>{t('process.toolbar.refreshFailedRetrying')}</span>
            </Tooltip>
          ) : (
            <span className={styles.refreshTime}>
              <CheckCircleOutlined style={{ marginRight: 4, color: 'var(--ant-color-success)' }} />
              {lastRefreshText}
            </span>
          )}
        </div>
      </Space>

      <Tooltip title={t('process.toolbar.manualRefresh')}>
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
