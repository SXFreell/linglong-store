import recommend from '@/assets/icons/recommend.svg'
import recommendActive from '@/assets/icons/recommendA.svg'
import rank from '@/assets/icons/rank.svg'
import rankA from '@/assets/icons/rankA.svg'
import update from '@/assets/icons/update.svg'
import updateA from '@/assets/icons/updateA.svg'
import classify from '@/assets/icons/classify.svg'
import classifyA from '@/assets/icons/classifyA.svg'

import type { TranslationKey } from '@/i18n'

interface MenuItemConfig {
  /** 菜单文案统一存 key，避免静态配置再次引入硬编码文案。 */
  menuNameKey: TranslationKey
  menuPath: string
  icon: string
  activeIcon: string
  show: boolean
  index: number
}

const menuList: MenuItemConfig[] = [
  {
    menuNameKey: 'layout.sidebar.recommend',
    menuPath: '/',
    icon: recommend,
    activeIcon: recommendActive,
    show: true,
    index: 0,
  },
  {
    menuNameKey: 'layout.sidebar.ranking',
    menuPath: '/ranking',
    icon: rank,
    activeIcon: rankA,
    show: false,
    index: 1,
  },
  {
    menuNameKey: 'layout.sidebar.category',
    menuPath: '/allapps',
    icon: classify,
    activeIcon: classifyA,
    show: true,
    index: 2,
  },
  {
    menuNameKey: 'layout.sidebar.update',
    menuPath: '/update_apps',
    icon: update,
    show: true,
    activeIcon: updateA,
    index: 7,
  },

]

export default menuList
