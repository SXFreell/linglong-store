import { Star, Ranking, Info, SettingTwo, Hourglass, ApplicationOne, UpdateRotation, ApplicationTwo } from '@icon-park/react'

export default [
  {
    menuName: '玲珑推荐',
    menuPath: '/',
    icon: <Star theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>,
    activeIcon: <Star theme="filled" size="16" fill="var(--ant-color-primary-text)"/>,
    index: 0,
  },
  {
    menuName: '排行榜',
    menuPath: '/ranking',
    icon: <Ranking theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>,
    activeIcon: <Ranking theme="filled" size="16" fill="var(--ant-color-primary-text)"/>,
    index: 1,
  },
  {
    menuName: '全部应用',
    menuPath: '/allapps',
    icon: <ApplicationOne theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>,
    activeIcon: <ApplicationOne theme="filled" size="16" fill="var(--ant-color-primary-text)"/>,
    index: 2,
  },
  {
    menuName: '我的应用',
    menuPath: '/my_apps',
    icon: <ApplicationTwo theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>,
    activeIcon: <ApplicationTwo theme="filled" size="16" fill="var(--ant-color-primary-text)"/>,
    index: 4,
  },
  {
    menuName: '软件更新',
    menuPath: '/update_apps',
    icon: <UpdateRotation theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>,
    activeIcon: <UpdateRotation theme="filled" size="16" fill="var(--ant-color-primary-text)"/>,
    index: 5,
  },
  {
    menuName: '玲珑进程',
    menuPath: '/process',
    icon: <Hourglass theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>,
    activeIcon: <Hourglass theme="filled" size="16" fill="var(--ant-color-primary-text)"/>,
    index: 6,
  },
  {
    menuName: '基础设置',
    menuPath: '/setting',
    icon: <SettingTwo theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>,
    activeIcon: <SettingTwo theme="filled" size="16" fill="var(--ant-color-primary-text)"/>,
    index: 7,
  },
  {
    menuName: '关于程序',
    menuPath: '/about',
    icon: <Info theme="outline" size="16" fill="var(--ant-color-text-secondary)"/>,
    activeIcon: <Info theme="filled" size="16" fill="var(--ant-color-primary-text)"/>,
    index: 8,
  },
]
