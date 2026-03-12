import { Descriptions, Drawer, Form, FormProps, Input, Button, Checkbox, message } from 'antd'
import styles from './index.module.scss'
import feedback from '@/assets/icons/feedback.svg'
import upgradeApp from '@/assets/icons/upgradeApp.svg'
import { useState, useEffect, useMemo } from 'react'
import { getLlCliVersion } from '@/apis/invoke'
import { getSearchAppList, suggest, uploadLog } from '@/apis/apps/index'
import { useGlobalStore } from '@/stores/global'
import { useUpdateStore } from '@/hooks/useUploadStore'
import TextArea from 'antd/es/input/TextArea'
import { readFile } from '@tauri-apps/plugin-fs'
import { homeDir, join } from '@tauri-apps/api/path'
import { useI18n } from '@/i18n'

type FieldType = {
  classification?: string[];
  overview?: string;
  description?: string;
  uploadLog?: boolean;
};
const LOG_FILE_RELATIVE = '.local/share/com.dongpl.linglong-store.v2/logs/linglong-store.log'

const AboutSoft = () => {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [messageApi, contextHolder] = message.useMessage()
  const [form] = Form.useForm()
  const [linglongVersion, setLinglongVersion] = useState<string>('1.7.4')
  const [linglongCount, setLinglongCount] = useState<string>(t('common.fallback.unknown'))
  const repoName = useGlobalStore((state) => state.repoName)
  const arch = useGlobalStore((state) => state.arch)
  const appVersion = useGlobalStore((state) => state.appVersion)
  const visitorId = useGlobalStore((state) => state.visitorId)
  const { checkForUpdate, checking } = useUpdateStore()
  const feedOptions = useMemo(() => ([
    t('setting.about.feedbackOptions.storeDefect'),
    t('setting.about.feedbackOptions.appUpdate'),
    t('setting.about.feedbackOptions.appFailure'),
  ]), [t])

  const linglongData = useMemo(() => [
    {
      label: t('setting.about.officialSite'),
      value: 'https://linyaps.org.cn/',
    },
    {
      label: t('setting.about.webStore'),
      value: 'https://store.linyaps.org.cn/',
    },
    {
      label: t('setting.about.appCount'),
      value: linglongCount === t('common.fallback.unknown')
        ? t('common.fallback.unknown')
        : t('setting.about.appCountValue', { count: linglongCount }),
    },
  ], [linglongCount, t])

  const versionData = useMemo(() => [
    {
      label: t('setting.about.currentStoreVersion'),
      value: appVersion,
    },
    {
      label: t('setting.about.currentLinglongVersion'),
      value: linglongVersion,
    },
    {
      label: t('setting.about.giteeRepo'),
      value: 'https://gitee.com/Shirosu/linglong-store',
    },
    {
      label: t('setting.about.githubRepo'),
      value: 'https://github.com/SXFreell/linglong-store',
    },
  ], [appVersion, linglongVersion, t])

  const descriptionStyles = useMemo(() => ({
    header: {
      marginBottom: 0,
    },
  }), [])

  const checkVersionClick = () => {
    if (checking) {
      return
    }
    checkForUpdate(appVersion, false)
  }

  const feedbackClick = () => {
    setOpen(true)
  }

  const onClose = () => {
    setOpen(false)
  }

  const onClickSubmitForm: FormProps<FieldType>['onFinish'] = async(values) => {
    console.info('提交反馈数据: ', values)
    try {
      let logFileUrl: string | undefined

      if (values.uploadLog) {
        try {
          const baseDir = await homeDir()
          const logFilePath = await join(baseDir, LOG_FILE_RELATIVE)
          const fileBytes = await readFile(logFilePath)
          const logFile = new File([fileBytes], 'linglong-store.log', { type: 'text/plain' })
          const uploadRes = await uploadLog(logFile)
          if (uploadRes.code === 200 && uploadRes.data) {
            logFileUrl = uploadRes.data
          } else {
            messageApi.error(uploadRes.message || t('setting.about.uploadLogFailed'))
            return
          }
        } catch (error) {
          console.error('Upload log error:', error)
          messageApi.error(t('setting.about.uploadLogFailed'))
          return
        }
      }

      // 反馈内容统一按“分类/概述/描述”结构拼接，便于服务端和人工排查时保持稳定格式。
      const emptyValue = t('common.fallback.none')
      const msg = `${t('setting.about.summary.classification')}: ${values.classification?.join(', ') || emptyValue}\n${t('setting.about.summary.overview')}: ${values.overview || emptyValue}\n${t('setting.about.summary.description')}: ${values.description || emptyValue}`
      const res = await suggest({
        message: msg,
        llVersion: linglongVersion,
        appVersion: appVersion,
        arch: arch,
        visitorId: visitorId,
        ...(logFileUrl ? { logFileUrl } : {}),
      })
      if (res.code === 200) {
        messageApi.success(t('setting.about.thankYou'), 1)
        setOpen(false)
        form.resetFields()
      } else {
        messageApi.error(res.message || t('setting.about.submitFailed'))
      }
    } catch (error) {
      console.error('Feedback error:', error)
      messageApi.error(t('setting.about.submitFailed'))
    }
  }

  useEffect(() => {
    // “关于程序”展示的是实时环境信息，因此在语言切换后允许重新刷新兜底文案。
    getLlCliVersion()
      .then((v) => {
        if (v) {
          setLinglongVersion(v as string)
        }
      })
      .catch((e) => {
        console.warn('Failed to get ll-cli version:', e)
        setLinglongVersion(t('common.fallback.unknown'))
      })
  }, [t])

  useEffect(() => {
    const fetchLinglongCount = async() => {
      try {
        const res = await getSearchAppList({
          repoName,
          arch,
          pageNo: 1,
          pageSize: 1,
        })
        const total = res?.data?.total
        if (typeof total === 'number') {
          setLinglongCount(total.toString())
        } else {
          setLinglongCount(t('common.fallback.unknown'))
        }
      } catch (error) {
        console.warn('Failed to get linglong count:', error)
        setLinglongCount(t('common.fallback.unknown'))
      }
    }

    fetchLinglongCount()
  }, [repoName, arch, t])

  return (
    <div className={styles.aboutPage}>
      <p className={styles.about_app}>{t('setting.about.pageTitle')}</p>
      <div className={styles.app_info}>
        <Descriptions
          className={styles.des_name}
          styles={descriptionStyles}
          colon={true}
          layout="horizontal"
          column={1}
          title={t('setting.about.linglongInfo')}> {linglongData.map((item, index) => (
            <Descriptions.Item label={item.label} key={`${item.value}_${index}`}>{item.value}</Descriptions.Item>
          ))}
        </Descriptions>
      </div>
      <div className={styles.version_info}>
        <Descriptions
          className={styles.des_name}
          styles={descriptionStyles}
          colon={true}
          layout="horizontal"
          column={1}
          title={t('setting.about.versionInfo')}> {versionData.map((item, index) => (
            <Descriptions.Item label={item.label} key={`${item.value}_${index}`}>{item.value}</Descriptions.Item>
          ))}
        </Descriptions>
      </div>
      <div className={styles.feedback}>
        <div className={styles.feed} onClick={feedbackClick}>  <img style={{ width: '1.1rem', height: '1.1rem' }} src={feedback} alt={t('setting.about.feedback')} /><span>{t('setting.about.feedback')}</span></div>
        {contextHolder}
        <div className={styles.checkVersion} onClick={checkVersionClick}><img style={{ width: '1.1rem', height: '1.1rem' }} src={upgradeApp} alt={t('setting.about.checkVersion')} /><span>{t('setting.about.checkVersion')}</span></div>
      </div>
      <Drawer
        title={t('setting.about.feedbackDrawerTitle')}
        onClose={onClose}
        open={open}
        closable={false}
        getContainer={false}
        destroyOnHidden={true}
      >
        <Form layout="horizontal" labelAlign="right" form={form} onFinish={onClickSubmitForm} clearOnDestroy={true}>
          <Form.Item colon label={t('setting.about.classification')} name="classification">
            <Checkbox.Group options={feedOptions} />
          </Form.Item>
          <Form.Item colon label={t('setting.about.overview')} name='overview'>
            <Input />
          </Form.Item>
          <Form.Item colon label={t('setting.about.description')} name='description'>
            <TextArea rows={6} />
          </Form.Item>
          <Form.Item colon label={t('setting.about.log')} name="uploadLog" valuePropName="checked">
            <Checkbox>{t('setting.about.uploadLog')}</Checkbox>
          </Form.Item>
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              {t('setting.about.submit')}
            </Button>
          </div>
        </Form>
      </Drawer>
    </div>
  )
}

export default AboutSoft
