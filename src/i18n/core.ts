import enUS from './resources/en-US'
import zhCN from './resources/zh-CN'
import type {
  LanguagePreference,
  SupportedLocale,
  TranslationKey,
  TranslationResource,
  TranslationParams,
} from './types'

const DEFAULT_LOCALE: SupportedLocale = 'zh-CN'

const resources: Record<SupportedLocale, TranslationResource> = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

let currentLocale: SupportedLocale = DEFAULT_LOCALE

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getNavigatorLocale(): string {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE
  }
  return navigator.language || DEFAULT_LOCALE
}

function normalizeLocale(input: string): SupportedLocale {
  const normalized = input.toLowerCase()
  if (normalized.startsWith('en')) {
    return 'en-US'
  }
  return 'zh-CN'
}

function getMessageByKey(messages: TranslationResource, key: TranslationKey): string | undefined {
  const segments = key.split('.')
  let cursor: unknown = messages

  for (const segment of segments) {
    if (!isRecord(cursor) || !(segment in cursor)) {
      return undefined
    }
    cursor = cursor[segment]
  }

  return typeof cursor === 'string' ? cursor : undefined
}

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template
  }

  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
    const value = params[key]
    return value === undefined || value === null ? '' : String(value)
  })
}

export function resolveLocale(preference: LanguagePreference, browserLocale = getNavigatorLocale()): SupportedLocale {
  if (preference === 'system') {
    return normalizeLocale(browserLocale)
  }
  return preference
}

export function initializeI18n(preference: LanguagePreference): SupportedLocale {
  const locale = resolveLocale(preference)
  setCurrentLocale(locale)
  return locale
}

export function setCurrentLocale(locale: SupportedLocale): void {
  currentLocale = locale
}

export function getCurrentLocale(): SupportedLocale {
  return currentLocale
}

export function translateWithLocale(
  locale: SupportedLocale,
  key: TranslationKey,
  params?: TranslationParams,
): string {
  const localeMessage = getMessageByKey(resources[locale], key)
  const fallbackMessage = getMessageByKey(resources[DEFAULT_LOCALE], key)
  const template = localeMessage || fallbackMessage || key
  return interpolate(template, params)
}

export function translate(key: TranslationKey, params?: TranslationParams): string {
  return translateWithLocale(currentLocale, key, params)
}
