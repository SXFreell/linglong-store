import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import type { Locale } from 'antd/es/locale'
import type { SupportedLocale } from './types'

const antdLocaleMap: Record<SupportedLocale, Locale> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

export function getAntdLocale(locale: SupportedLocale): Locale {
  return antdLocaleMap[locale]
}
