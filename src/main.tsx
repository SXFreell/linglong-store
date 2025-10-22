import React from 'react'
import ReactDOM from 'react-dom/client'
import '@arco-design/web-react/dist/css/arco.css'
import './styles/App.scss'
import Router from './router'
import { tauriAppConfigHandler } from './stores/appConfig'

// 初始化应用配置
await tauriAppConfigHandler.start()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
