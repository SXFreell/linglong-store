declare namespace API {
    namespace APP {
        /**
         * 应用主数据模型
         */
        interface AppMainDto {
            /** ID */
            id: string
            /** 应用ID */
            appId: string
            /** 图标 */
            icon: string
            /** 中文名称 */
            zhName: string
            /** 名称 */
            name: string
            /** 分类ID */
            categoryId: string
            /** 分类名称 */
            categoryName: string
            /** 通道 */
            channel: string
            /** 架构 */
            arch: string
            /** 描述 */
            description: string
            /** 类型 */
            kind: string
            /** 模块 */
            module: string
            /** 仓库名称 */
            repoName: string
            /** 运行时 */
            runtime: string
            /** 大小 */
            size: string
            /** UAB地址 */
            uabUrl: string
            /** 用户/开发者 */
            user: string
            /** 版本 */
            version: string
            /** 安装次数 */
            installCount: number
            /** 卸载次数 */
            uninstallCount: number
            /** 标志 */
            flag: string
            /** 创建时间 */
            createTime: string
            /** 更新时间 */
            updateTime: string
            /** 是否删除 */
            isDelete: string
            /** 是否受欢迎 */
            isWelcomed: string
        }

        /**
         * 应用分类
         */
        interface AppCategories {
            /** ID */
            id: string
            /** 分类ID */
            categoryId: string
            /** 分类名称 */
            categoryName: string
            /** 图标 */
            icon: string
            /** 创建时间 */
            createTime: string
            /** 是否删除 */
            isDelete: string
            /** 应用数量 */
            count: string
        }

        /**
         * 应用主数据查询参数
         * @extends API.Common.PageParams
         */
        interface AppMainVO extends API.Common.PageParams {
            /** 主键ID */
            id?: string
            /** 应用ID */
            appId?: string
            /** 图标 */
            icon?: string
            /** 中文名称 */
            zhName?: string
            /** 分类ID */
            categoryId?: string
            /** 名称 */
            name?: string
            /** 通道 */
            channel?: string
            /** 架构 */
            arch?: string
            /** 描述 */
            description?: string
            /** 类型 */
            kind?: string
            /** 模块 */
            module?: string
            /** 仓库名称 */
            repoName?: string
            /** 运行时 */
            runtime?: string
            /** 大小 */
            size?: string
            /** UAB地址 */
            uabUrl?: string
            /** 用户 */
            user?: string
            /** 版本 */
            version?: string
            /** 标志 */
            flag?: string
            /** 创建时间 */
            createTime?: string
            /** 是否删除 */
            isDelete?: string
            /** 图标是否显示 */
            iconNoShow?: string
            /** 语言 */
            lan?: string
        }

        /**
         * 搜索应用列表 - 请求参数
         * @extends API.Common.PageParams
         */
        interface SearchAppListParams extends API.Common.PageParams {
            /** 应用名称 */
            name?: string
            /** 分类ID */
            categoryId?: string
            [key: string]: unknown
        }

        /**
         * 应用详情查询参数
         */
        interface AppDetailsVO {
            /** 应用ID */
            appId?: string
            /** 名称 */
            name?: string
            /** 版本 */
            version?: string
            /** 通道 */
            channel?: string
            /** 模块 */
            module?: string
            /** 架构 */
            arch?: string
        }

        /**
         * 推荐应用搜索参数
         * @extends API.Common.PageParams
         */
        interface AppWelcomeSearchVO extends API.Common.PageParams {
            /** 应用ID */
            appId?: string
            /** 名称 */
            name?: string
            /** 仓库名称 */
            repoName?: string
            /** 架构 */
            arch?: string
            /** 语言 */
            lang?: string
        }

        /**
         * 安装记录保存参数
         */
        interface AppVisitSaveVO {
            /** 应用ID */
            appId?: string
            /** 名称 */
            name?: string
            /** 版本 */
            version?: string
            /** 命令（安装/卸载） */
            command?: string
            /** 仓库名称 */
            repoName?: string
            /** 访问者ID */
            visitorId?: string
            /** 客户端IP */
            clientIp?: string
        }

        /**
         * 用户登录记录保存参数
         */
        interface AppLoginSaveVO {
            /** 访问者IP */
            visit?: string
            /** 访问者ID/指纹码 */
            visitorId?: string
            /** 玲珑组件版本 */
            llVersion?: string
            /** 玲珑Bin组件版本 */
            llBinVersion?: string
            /** 商店版本 */
            appVersion?: string
            /** 详细信息 */
            detailMsg?: string
            /** 系统版本 */
            osVersion?: string
            /** 消息/反馈内容 */
            message?: string
            /** 创建时间 */
            createTime?: string
            /** 是否删除 */
            isDelete?: string
            /** 客户端IP */
            clientIp?: string
        }

        /**
         * 基础配置详情
         */
        interface BaseConfigDtl {
            /** ID */
            id?: string
            /** 配置键 */
            configKey?: string
            /** 配置值 */
            configValue?: string
            /** 备注 */
            remark?: string
            /** 创建时间 */
            createTime?: string
            /** 更新时间 */
            updateTime?: string
            /** 是否删除 */
            isDeleted?: string
        }

        // ==================== 接口响应类型 ====================

        /**
         * 获取分类列表 - 响应参数
         * @description 返回应用分类的数组
         */
        type GetDisCategoryListRes = AppCategories

        /**
         * 获取应用列表 - 响应参数（分页）
         */
        type GetAppListRes = API.Common.IPageData<AppMainDto>

        /**
         * 获取应用详情 - 响应参数（数组）
         */
        type GetAppDetailsRes = AppMainDto[]

        /**
         * 获取轮播图列表 - 响应参数
         */
        type GetWelcomeCarouselListRes = AppMainDto[]

        /**
         * 获取应用版本列表 - 响应参数
         */
        type GetAppVersionListRes = AppMainDto[]

        /**
         * 获取Shell脚本 - 响应参数
         */
        type GetShellStringRes = string
    }
}
