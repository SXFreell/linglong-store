import zhCN from './resources/zh-CN'

type Primitive = string | number | boolean | null | undefined

type DotPath<T> = T extends Primitive
  ? never
  : {
      [K in keyof T & string]: T[K] extends Primitive
        ? K
        : K | `${K}.${DotPath<T[K]>}`
    }[keyof T & string]

export type TranslationMessages = typeof zhCN
export type TranslationKey = DotPath<TranslationMessages>

/** 递归将字面量字符串类型放宽为 string，用于约束不同语言资源文件的结构一致性 */
type DeepStringify<T> = {
  readonly [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}
export type TranslationResource = DeepStringify<TranslationMessages>

export type SupportedLocale = 'zh-CN' | 'en-US'
export type LanguagePreference = 'system' | SupportedLocale
export type TranslationParams = Record<string, Primitive>
