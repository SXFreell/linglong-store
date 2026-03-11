import recommend from '@/assets/icons/recommend.svg'
import recommendActive from '@/assets/icons/recommendA.svg'
import rank from '@/assets/icons/rank.svg'
import rankA from '@/assets/icons/rankA.svg'
import update from '@/assets/icons/update.svg'
import updateA from '@/assets/icons/updateA.svg'
import classify from '@/assets/icons/classify.svg'
import classifyA from '@/assets/icons/classifyA.svg'


export default [
  {
    menuName: '推荐',
    menuPath: '/',
    icon: recommend,
    activeIcon: recommendActive,
    show: true,
    index: 0,
  },
  {
    menuName: '排行榜',
    menuPath: '/ranking',
    icon: rank,
    activeIcon: rankA,
    show: false,
    index: 1,
  },
  {
    menuName: '分类',
    menuPath: '/allapps',
    icon: classify,
    activeIcon: classifyA,
    show: true,
    index: 2,
  },
  {
    menuName: '更新',
    menuPath: '/update_apps',
    icon: update,
    show: true,
    activeIcon: updateA,
    index: 7,
  },

]
