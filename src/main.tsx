import React from 'react'
import ReactDOM from 'react-dom/client'
import '@arco-design/web-react/dist/css/arco.css'
import './styles/App.scss'
import Router from './router'
import { tauriAppConfigHandler } from './stores/appConfig'

// 初始化应用配置
await tauriAppConfigHandler.start()

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

// 在开发环境使用 StrictMode 进行检测
// 在生产环境移除 StrictMode 以避免性能开销
if (import.meta.env.DEV) {
  root.render(
    <React.StrictMode>
      <Router />
    </React.StrictMode>,
  )
} else {
  root.render(<Router />)
}
