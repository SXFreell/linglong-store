import styles from './index.module.scss'
import Logo from '@/assets/linyaps.svg'

import { useLaunch } from '@/hooks/launch'
import { Progress } from 'antd'
import LinglongEnvDialog from '@/components/LinglongEnvDialog'
import { useI18n } from '@/i18n'

// 首屏页面
const LaunchPage = ()=>{
  const { t } = useI18n()
  const {
    progress,
    currentStep,
    error,
    retry,
    envReady,
    envChecked,
  } = useLaunch()

  return <div className={styles.launchPage} >
    <div className={styles.main}>
      <div className={
        styles.logo
      }> <img src={Logo} alt={t('layout.launchPage.logoAlt')} />   </div>
      <div className={styles.name}>{t('common.appName')}</div>
      <div className={styles.step}>{currentStep}</div>
      <div className={styles.progress}>
        <Progress percent={progress} showInfo={false} />
      </div>
    </div>
    <div className={styles.footer}>
      <p className={styles.notice}>{t('layout.launchPage.noticeTitle')}</p>
      <p className={styles.notice}>1.{t('layout.launchPage.notice1')}</p>
      <p className={styles.notice}>2.{t('layout.launchPage.notice2')}</p>
      <p className={styles.notice}>3.{t('layout.launchPage.notice3')}</p>
      <p className={styles.notice}>4.{t('layout.launchPage.notice4')}</p>
    </div>
    <LinglongEnvDialog
      open={envChecked && !envReady}
      reason={error || undefined}
      onEnvReady={retry}
    />
  </div>
}

export default LaunchPage
