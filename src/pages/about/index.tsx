import { Descriptions, Drawer, Form, Input, Button, Checkbox, Modal, GetProp, message } from 'antd'
import styles from './index.module.scss'
import feedback from '@/assets/icons/feedback.svg'
import update from '@/assets/icons/update.svg'
import { useState } from 'react'
import TextArea from 'antd/es/input/TextArea'

// 问题类型
const feedOptions = ['商店缺陷', '应用更新', '应用故障']

const AboutSoft = () => {
  const [open, setOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const linglong_data = [
    {
      label: '玲珑官网',
      value: 'https://linglong.space/',
    },
    {
      label: '玲珑网页版商店',
      value: 'https://store.linyaps.org.cn/',
    },
    {
      label: '当前共收录玲珑程序数',
      value: '4391个',
    },
  ]
  const version_data = [
    {
      label: '当前商店版本',
      value: '1.3.3',
    },
    {
      label: '当前玲珑组件版本',
      value: '1.7.4',
    },
    {
      label: '开发作者',
      value: 'Jokul<986432015@qq.com>',
    },
    {
      label: '码云地址',
      value: 'https://gitee.com/okul2018/linglong_store',
    },
    {
      label: 'github地址',
      value: 'https://github.com/GershonWang/linglong-store',
    },
  ]
  const checkVersionClick = ()=>{
    console.log('检查版本！！！！！')
    const num = Math.random()
    if (num > 0.5) {
      setModalOpen(true)
      return
    }
    messageApi.success('当前已是最新版本！', 1)

  }
  const feedbackClick = ()=>{
    console.log('意见反馈！！！！！')
    setOpen(true)
  }
  const onClose = () => {
    setOpen(false)
  }
  const onChange: GetProp<typeof Checkbox.Group, 'onChange'> = (checkedValues) => {
    console.log('checked = ', checkedValues)
  }
  return (
    <div className={styles.aboutPage}>
      <p className={styles.about_app}>关于程序</p>
      <div className={styles.app_info}>
        <Descriptions
          className={styles.des_name}
          styles={{
            header: {
              marginBottom: 0,
            },
          }}
          colon={true}
          layout="horizontal"
          column={1}
          title='玲珑信息'> {linglong_data.map((item, index) => (
            <Descriptions.Item label={item.label} key={`${item.value}_${index}`}>{item.value}</Descriptions.Item>
          ))}

        </ Descriptions>
      </div>
      <div className={styles.version_info}>
        <Descriptions
          className={styles.des_name}
          styles={{
            header: {
              marginBottom: 0,
            },
          }}
          colon={true}
          layout="horizontal"
          column={1}
          title='版本信息'> {version_data.map((item, index) => (
            <Descriptions.Item label={item.label} key={`${item.value}_${index}`}>{item.value}</Descriptions.Item>
          ))}

        </ Descriptions>
      </div>
      <div className={styles.feedback}>
        <div className={styles.feed} onClick={feedbackClick}>  <img style={{ width: '1.1rem', height: '1.1rem' }} src={feedback} alt="意见反馈" /><span>意见反馈</span></div>
        {contextHolder}
        <div className={styles.checkVersion} onClick={checkVersionClick}><img style={{ width: '1.1rem', height: '1.1rem' }} src={update} alt="检查玲珑版本" /><span>检查玲珑版本</span></div>
      </div>
      <Drawer
        title="意见反馈"
        onClose={onClose}
        open={open}
        closable={false}
        getContainer={false}
      >
        <Form layout="horizontal" labelAlign="right">
          <Form.Item colon label="分类" name="disabled" valuePropName="checked">
            <Checkbox.Group options={feedOptions} defaultValue={['Apple']} onChange={onChange} />
          </Form.Item>
          <Form.Item colon label="概述">
            <Input />
          </Form.Item>
          <Form.Item colon label="描述">
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit">
          提交
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Drawer>
      <Modal
        title="版本更新"
        centered
        closable={false}
        okText="确定"
        cancelText="取消"
        width={300}
        open={modalOpen}
        onOk={() => setModalOpen(false)}
        onCancel={() => setModalOpen(false)}
      >
        <p>当前版本：1.2.3</p>
        <p>最新版本：1.2.5</p>
        <p>是否更新到新版本？</p>
      </Modal>
    </div>
  )
}
export default AboutSoft
