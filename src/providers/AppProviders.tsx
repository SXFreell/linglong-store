import { App, ConfigProvider } from 'antd'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { useCurrentLocale } from '@/i18n'
import { getAntdLocale } from '@/i18n'
import { ComponentsTheme, Token } from '@/styles/Theme'

/**
 * 根级 Provider。
 * 统一把主题和 Ant Design 的 locale 收口到一个入口，避免后续语言切换时在多个入口分别处理。
 */
const AppProviders = ({ children }: PropsWithChildren) => {
  const locale = useCurrentLocale()

  const antdLocale = useMemo(() => {
    return getAntdLocale(locale)
  }, [locale])

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{ cssVar: true, hashed: false, token: Token, components: ComponentsTheme }}>
      <App>{children}</App>
    </ConfigProvider>
  )
}

export default AppProviders
