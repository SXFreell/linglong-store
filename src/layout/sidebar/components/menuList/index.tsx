import { Star, Ranking, Info, SettingTwo, Hourglass, ApplicationOne, UpdateRotation, ApplicationTwo } from '@icon-park/react'

export default [
  {
    menuName: '玲珑推荐',
    menuPath: '/',
    icon: <Star theme="outline" size="16" fill="var(--color-text-1)"/>,
    activeIcon: <Star theme="filled" size="16" fill="rgb(var(--primary-6))"/>,
    index: 0,
  },
  {
    menuName: '排行榜',
    menuPath: '/ranking',
    icon: <Ranking theme="outline" size="16" fill="var(--color-text-1)"/>,
    activeIcon: <Ranking theme="filled" size="16" fill="rgb(var(--primary-6))"/>,
    index: 1,
  },
  {
    menuName: '全部应用',
    menuPath: '/allapps',
    icon: <ApplicationOne theme="outline" size="16" fill="var(--color-text-1)"/>,
    activeIcon: <ApplicationOne theme="filled" size="16" fill="rgb(var(--primary-6))"/>,
    index: 2,
  },
  {
    menuName: '我的应用',
    menuPath: '/my_apps',
    icon: <ApplicationTwo theme="outline" size="16" fill="var(--color-text-1)"/>,
    activeIcon: <ApplicationTwo theme="filled" size="16" fill="rgb(var(--primary-6))"/>,
    index: 4,
  },
  {
    menuName: '软件更新',
    menuPath: '/update_apps',
    icon: <UpdateRotation theme="outline" size="16" fill="var(--color-text-1)"/>,
    activeIcon: <UpdateRotation theme="filled" size="16" fill="rgb(var(--primary-6))"/>,
    index: 5,
  },
  {
    menuName: '玲珑进程',
    menuPath: '/process',
    icon: <Hourglass theme="outline" size="16" fill="var(--color-text-1)"/>,
    activeIcon: <Hourglass theme="filled" size="16" fill="rgb(var(--primary-6))"/>,
    index: 6,
  },
  {
    menuName: '基础设置',
    menuPath: '/setting',
    icon: <SettingTwo theme="outline" size="16" fill="var(--color-text-1)"/>,
    activeIcon: <SettingTwo theme="filled" size="16" fill="rgb(var(--primary-6))"/>,
    index: 7,
  },
  {
    menuName: '关于程序',
    menuPath: '/about',
    icon: <Info theme="outline" size="16" fill="var(--color-text-1)"/>,
    activeIcon: <Info theme="filled" size="16" fill="rgb(var(--primary-6))"/>,
    index: 8,
  },
]
