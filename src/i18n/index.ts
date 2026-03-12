import { useEffect, useMemo } from 'react'
import { useConfigStore } from '@/stores/appConfig'
import { getCurrentLocale, initializeI18n, resolveLocale, setCurrentLocale, translate, translateWithLocale } from './core'
import type { LanguagePreference, SupportedLocale, TranslationKey, TranslationParams } from './types'
export { getAntdLocale } from './antd'

/**
 * 统一暴露当前语言解析逻辑，避免组件直接依赖 navigator.language 之类的运行时细节。
 */
export function useCurrentLocale(): SupportedLocale {
  const preference = useConfigStore((state) => state.languagePreference)

  return useMemo(() => {
    return resolveLocale(preference)
  }, [preference])
}

/**
 * 轻量版 i18n hook。
 * 这里统一封装 locale 解析、语言同步和翻译调用，避免页面层直接感知运行时细节。
 */
export function useI18n(): {
  locale: SupportedLocale
  languagePreference: LanguagePreference
  t: (key: TranslationKey, params?: TranslationParams) => string
  } {
  const languagePreference = useConfigStore((state) => state.languagePreference)
  const locale = useCurrentLocale()

  useEffect(() => {
    setCurrentLocale(locale)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  return {
    locale,
    languagePreference,
    t: (key, params) => translateWithLocale(locale, key, params),
  }
}

export {
  getCurrentLocale,
  initializeI18n,
  resolveLocale,
  setCurrentLocale,
  translate,
  translateWithLocale,
}

export type {
  LanguagePreference,
  SupportedLocale,
  TranslationKey,
  TranslationParams,
}
