import { createRouter, createWebHashHistory } from 'vue-router'


const router = createRouter({
    // 4. 内部提供了 history 模式的实现。为了简单起见，我们在这里使用 hash 模式。
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            component: () => import("../pages/index.vue")
        },
        {
            path: '/main_view',
            redirect: '/welcome_menu',
            component: () => import("../pages/mainView/index.vue"),
            children: [
                {
                    path: '/welcome_menu',
                    name: 'WelcomeMenu',
                    component: () => import("../pages/mainView/WelcomeMenu/index.vue")
                },
                {
                    path: '/search',
                    name: 'Search',
                    component: () => import("../pages/mainView/SearchMenu/index.vue"),
                    beforeEnter: (to, from, next) => {
                        // 在路由进入时执行的操作(非明细页面重置元数据)
                        if (from.name != 'Detail') {
                            to.meta.savedCategoryId = ''; // 将分类ID保存到路由元数据中
                            to.meta.savedPageNo = 0; // 将页码保存到路由元数据中
                            to.meta.savedPageSize = 0; // 将每页条数保存到路由元数据中
                            to.meta.savedPosition = 0;
                        }
                        // 如果需要继续导航，调用 next()
                        next();
                    },
                },
                {
                    path: '/ranking_menu',
                    name: 'RankingMenu',
                    component: () => import("../pages/mainView/RankingMenu/index.vue"),
                    children: [
                        {
                            path: '/new_ranking',
                            name: 'NewRanking',
                            component: () => import("../pages/mainView/RankingMenu/NewRanking/index.vue"),
                        },
                        {
                            path: '/down_ranking',
                            name: 'DownRanking',
                            component: () => import("../pages/mainView/RankingMenu/DownRanking/index.vue")
                        }
                    ]
                },
                {
                    path: '/all_app_menu',
                    name: 'AllAppMenu',
                    component: () => import("../pages/mainView/AllAppMenu/index.vue"),
                    beforeEnter: (to, from, next) => {
                        // 在路由进入时执行的操作(非明细页面重置元数据)
                        if (from.name != 'Detail') {
                            to.meta.savedSearchName = ''; // 将搜索内容保存到路由元数据中
                            to.meta.savedCategoryId = ''; // 将分类ID保存到路由元数据中
                            to.meta.savedPageNo = 0; // 将页码保存到路由元数据中
                            to.meta.savedPageSize = 0; // 将每页条数保存到路由元数据中
                            to.meta.savedPosition = 0;
                        }
                        // 如果需要继续导航，调用 next()
                        next();
                    },
                },
                {
                    path: '/update_menu',
                    name: 'UpdateMenu',
                    component: () => import("../pages/mainView/UpdateMenu/index.vue")
                },
                {
                    path: '/installed_menu',
                    name: 'InstalledMenu',
                    component: () => import("../pages/mainView/InstalledMenu/index.vue"),
                },
                {
                    path: '/runtime_menu',
                    name: 'RuntimeMenu',
                    component: () => import("../pages/mainView/RuntimeMenu/index.vue")
                },
                {
                    path: '/config_menu',
                    name: 'ConfigMenu',
                    component: () => import("../pages/mainView/ConfigMenu/index.vue")
                },
                {
                    path: '/about_menu',
                    name: 'AboutMenu',
                    component: () => import("../pages/mainView/AboutMenu/index.vue")
                },
                {
                    path: '/my_app_menu',
                    name: 'MyAppMenu',
                    component: () => import("../pages/mainView/MyAppMenu/index.vue"),
                },
                {
                    path: '/details',
                    name: 'Detail',
                    component: () => import("../components/details.vue")
                },
                {
                    path: '/terminalOutput',
                    name: 'TerminalOutput',
                    component: () => import("../components/TerminalOutput.vue")
                },
            ],
        },
        {
            path: '/my_apps_menu',
            name: 'MyAppsMenu',
            component: () => import("../pages/mainView/MyAppMenu/index.vue"),
        },
    ], // `routes: routes` 的缩写
})

export default router