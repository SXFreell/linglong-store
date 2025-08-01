import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { lazy } from 'react'
import Layout from '../layout'

// 懒加载路由组件
const Recommend = lazy(() => import('../pages/recommend'))
const Ranking = lazy(() => import('../pages/ranking'))

// 路由配置
const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Recommend />,
      },
      {
        path: '/ranking',
        element: <Ranking />,
      },
    ],
  },
])

// 路由提供者组件
const Router = () => {
  return <RouterProvider router={router} />
}

export default Router
