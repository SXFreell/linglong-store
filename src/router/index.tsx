import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { lazy } from 'react'
import Layout from '../layout'

// 懒加载路由组件
const Recommend = lazy(() => import('../pages/recommend'))
const Ranking = lazy(() => import('../pages/ranking'))
const AllApps = lazy(() => import('../pages/allApps'))
const About = lazy(() => import('../pages/about'))
const Setting = lazy(() => import('../pages/setting'))
const Process = lazy(()=>import('../pages/process'))

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
      {
        path: '/allapps',
        element: <AllApps />,
      },
      {
        path: '/about',
        element: <About />,
      },
      {
        path: '/setting',
        element: <Setting />,
      },
      {
        path: '/process',
        element: <Process />,
      },
    ],
  },
])

// 路由提供者组件
const Router = () => {
  return <RouterProvider router={router} />
}

export default Router
