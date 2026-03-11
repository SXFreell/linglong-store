import { Table, Tag, Spin, Empty, Button, Tooltip } from 'antd'
import { MoreOutlined, LoadingOutlined } from '@ant-design/icons'
import type { TableColumnsType } from 'antd'
import styles from './index.module.scss'

type RunningApp = API.INVOKE.RunningApp

interface ProcessTableProps {
  processes: RunningApp[]
  isInitialLoading: boolean
  /** 正在执行停止操作的行 id 集合（containerId） */
  killLoadingIds: Set<string>
  /** 当前右键选中的行 id */
  contextMenuRowId: string | null
  /** 右键点击某行 */
  onContextMenu: (e: React.MouseEvent, record: RunningApp) => void
  /** 点击"更多"按钮（兜底入口） */
  onMoreClick: (e: React.MouseEvent, record: RunningApp) => void
}

const ProcessTable: React.FC<ProcessTableProps> = ({
  processes,
  isInitialLoading,
  killLoadingIds,
  contextMenuRowId,
  onContextMenu,
  onMoreClick,
}) => {
  const columns: TableColumnsType<RunningApp> = [
    {
      title: '应用名称',
      dataIndex: 'name',
      ellipsis: true,
      render: (name: string) => (
        <span className={styles.appName}>{name}</span>
      ),
    },
    {
      title: '版本号',
      dataIndex: 'version',
      width: 120,
      align: 'center',
      render: (v: string) => v || <span className={styles.emptyCell}>—</span>,
    },
    {
      title: '架构',
      dataIndex: 'arch',
      width: 100,
      align: 'center',
      render: (v: string) =>
        v ? <Tag bordered={false}>{v}</Tag> : <span className={styles.emptyCell}>—</span>,
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      width: 90,
      align: 'center',
      render: (v: string) =>
        v ? <Tag bordered={false} color="blue">{v}</Tag> : <span className={styles.emptyCell}>—</span>,
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 90,
      align: 'center',
      render: (v: string) =>
        v ? <Tag bordered={false} color="geekblue">{v}</Tag> : <span className={styles.emptyCell}>—</span>,
    },
    {
      title: 'PID',
      dataIndex: 'pid',
      width: 90,
      align: 'center',
      render: (v: string) => <span className={styles.monoText}>{v}</span>,
    },
    {
      title: '容器 ID',
      dataIndex: 'containerId',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v}>
          <span className={styles.monoText}>{v}</span>
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'more',
      width: 48,
      align: 'center',
      render: (_: unknown, record: RunningApp) => {
        const isKilling = killLoadingIds.has(record.id)
        return (
          <Button
            type="text"
            size="small"
            icon={isKilling ? <LoadingOutlined /> : <MoreOutlined />}
            disabled={isKilling}
            onClick={(e) => {
              e.stopPropagation()
              onMoreClick(e, record)
            }}
          />
        )
      },
    },
  ]

  if (isInitialLoading) {
    return (
      <div className={styles.centerState}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Table<RunningApp>
      columns={columns}
      dataSource={processes}
      rowKey="id"
      scroll={{ x: 'max-content' }}
      pagination={false}
      locale={{
        emptyText: (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="当前没有运行中的玲珑应用"
          />
        ),
      }}
      onRow={(record) => ({
        onContextMenu: (e) => onContextMenu(e, record),
        className: [
          styles.processRow,
          killLoadingIds.has(record.id) ? styles.rowKilling : '',
          contextMenuRowId === record.id ? styles.rowSelected : '',
        ]
          .filter(Boolean)
          .join(' '),
      })}
    />
  )
}

export default ProcessTable
