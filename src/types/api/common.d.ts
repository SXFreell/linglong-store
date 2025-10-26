declare namespace API {
    namespace Common {
        /**
         * 基础响应结构
         * @template T 响应数据的类型
         */
        interface BaseResponse<T> {
            /** 响应状态码 */
            code: number
            /** 响应消息 */
            message: string
            /** 响应数据 */
            data: T
        }

        /**
         * 分页排序项
         */
        interface OrderItem {
            /** 排序字段 */
            column: string
            /** 是否升序 */
            asc: boolean
        }

        /**
         * 分页数据结构
         * @template T 数据项的类型
         */
        interface IPageData<T> {
            /** 数据列表 */
            records: T[]
            /** 总数 */
            total: number
            /** 每页显示条数 */
            size: number
            /** 当前页 */
            current: number
            /** 排序信息 */
            orders: OrderItem[]
            /** 自动优化 COUNT SQL */
            optimizeCountSql: boolean
            /** 是否进行 count 查询 */
            searchCount: boolean
            /** 优化 JOIN COUNT SQL */
            optimizeJoinOfCountSql: boolean
            /** 单页分页条数限制 */
            maxLimit: number
            /** countId */
            countId: string
            /** 总页数 */
            pages: number
        }

        /**
         * 分页请求参数
         */
        interface PageParams {
            /** 当前页码 */
            pageNo?: number
            /** 每页显示条数 */
            pageSize?: number
            /** 排序字段 */
            sort?: string
            /** 排序方式 desc/asc */
            order?: string
        }
    }
}
