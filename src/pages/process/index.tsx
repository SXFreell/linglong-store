import { Table, Button, Message } from '@arco-design/web-react'
import { useState, useEffect } from 'react'
import { getRunningLinglongApps, killLinglongApp } from '../../apis'

interface LinglongAppInfo {
  key: string
  name: string
  version: string
  arch: string
  channel: string
  source: string
  pid: string
  container_id: string
}

const Process = () => {
  const [data, setData] = useState<LinglongAppInfo[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  const fetchRunningApps = async() => {
    try {
      const apps = await getRunningLinglongApps() as LinglongAppInfo[]
      const formattedApps = apps.map((app, index) => ({
        ...app,
        key: (index + 1).toString(),
      }))
      setData(formattedApps)
    } catch {
      Message.error('获取运行中的玲珑应用失败')
    }
  }

  useEffect(() => {
    // 初始加载
    fetchRunningApps()

    // 设置定时器，每秒刷新一次
    const intervalId = setInterval(() => {
      fetchRunningApps()
    }, 1000)

    // 清理函数：组件卸载时清除定时器
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const processClick = async(record: LinglongAppInfo) => {
    try {
      setLoading(record.name)
      await killLinglongApp(record.name)
      Message.success(`成功停止 ${record.name}`)
      // 刷新列表
      await fetchRunningApps()
    } catch (error) {
      Message.error(`停止 ${record.name} 失败: ${error}`)
    } finally {
      setLoading(null)
    }
  }

  const columns = [
    {
      title: '包名',
      dataIndex: 'name',
      ellipsis: true,
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '版本号',
      dataIndex: 'version',
      align: 'center' as const,
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '架构',
      dataIndex: 'arch',
      align: 'center' as const,
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      align: 'center' as const,
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      align: 'center' as const,
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '进程ID',
      dataIndex: 'pid',
      align: 'center' as const,
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '容器ID',
      dataIndex: 'container_id',
      ellipsis: true,
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '操作',
      dataIndex: 'operate',
      align: 'center' as const,
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
      render: (_col: unknown, record: LinglongAppInfo) => (
        <Button
          type='primary'
          status='danger'
          onClick={() => processClick(record)}
          loading={loading === record.name}
        >
          停止
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: 20 }}>
      <Table
        columns={columns}
        data={data}
        hover
        pagePosition='bottomCenter'
        border={{
          wrapper: true,
          headerCell: true,
        }}
      />
    </div>
  )
}

export default Process
