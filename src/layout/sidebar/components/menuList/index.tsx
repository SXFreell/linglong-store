import { Star, Ranking } from "@icon-park/react";

export default [
  {
    menuName: '玲珑推荐',
    menuPath: '/',
    icon: <Star theme="outline" size="16" fill="#4E4E4E"/>,
    activeIcon: <Star theme="filled" size="16" fill="#016FFD"/>,
    index: 0
  },
  {
    menuName: '排行榜',
    menuPath: '/ranking',
    icon: <Ranking theme="outline" size="16" fill="#4E4E4E"/>,
    activeIcon: <Ranking theme="filled" size="16" fill="#016FFD"/>,
    index: 1
  },
]