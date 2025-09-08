import { Table, Button } from '@arco-design/web-react'
import { useState } from 'react'


const Process = () => {
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
      align: 'center',
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '架构',
      dataIndex: 'framework',
      align: 'center',
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      align: 'center',
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '来源',
      dataIndex: 'source',
      align: 'center',
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
    },
    {
      title: '进程ID',
      dataIndex: 'process_id',
      align: 'center',
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
      align: 'center',
      headerCellStyle: {
        backgroundColor: 'var(--color-bg-2)',
      },
      // 等接口数据出来再替换any
      render: (_col:any, record:any) => (
        <Button type='primary' status='danger' onClick={()=>processClick(record)}>
        停止
        </Button>
      ),
    },
  ]

  const [data] = useState([
    {
      key: '1',
      name: 'org.dde.calendar',
      version: '5.14.7.3',
      framework: 'x86_64',
      channel: 'main',
      source: 'stable',
      process_id: '6363',
      container_id: '003f05894ac4',
    },
    {
      key: '2',
      name: 'org.dde.calendar',
      version: '5.14.7.3',
      framework: 'x86_64',
      channel: 'main',
      source: 'stable',
      process_id: '6363',
      container_id: '003f05894ac4',
    },
  ])
  const processClick = (item:any)=>{
    console.log(item, '删除=>item==========')

  }
  return (
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
  )
}

export default Process
