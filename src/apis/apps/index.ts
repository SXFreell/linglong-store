import { get, post, BaseResponse } from '..'
import type {
  Category,
  SearchAppListParams,
  SearchAppListRes,
  GetAppDetailsRes,
  GetWelcomeCarouselListRes,
  GetWelcomeAppListRes,
} from './types'

/**
 * 推荐页面-获取轮播图列表已接入
 */
export const getWelcomeCarouselList = (data: Record<string, unknown>) => {
  return post<GetWelcomeCarouselListRes>('/visit/getWelcomeCarouselList', data)
}

/**
* 获取最受欢迎的推荐应用列表 已接入
* @param data 入参条件(分页参数)
* @returns
*/
export const getWelcomeAppList = (data: Record<string, unknown>) => {
  return post<GetWelcomeAppListRes>('/visit/getWelcomeAppList', data)
}

/**
* 获取最新应用列表
* @param data 入参条件
* @returns
*/
export const getNewAppList = (data: Record<string, unknown>) => {
  return post<BaseResponse<unknown>>('/visit/getNewAppList', data)
}

/**
* 获取下载量排行应用列表
* @param data 入参条件
* @returns
*/
export const getInstallAppList = (data: Record<string, unknown>) => {
  return post<BaseResponse<unknown>>('/visit/getInstallAppList', data)
}

/**
* 获取应用分类
*/
export const getDisCategoryList = () => {
  return get<BaseResponse<Category[]>>('/visit/getDisCategoryList')
}

/**
* 根据appid获取程序列表
*/
export const getSearchAppVersionList = (data: Record<string, unknown>) => {
  return post<BaseResponse<unknown>>('/visit/getSearchAppVersionList', data)
}

/**
* 根据查询条件名称或者分类获取玲珑列表(分页)
* @param data 查询条件
* @returns
*/
export const getSearchAppList = (data: SearchAppListParams) => {
  return post<SearchAppListRes>('/visit/getSearchAppList', data)
}

/**
* 获取程序的详细信息（包括图标等）
*/
export const getAppDetails = (data: Record<string, unknown>) => {
  return post<GetAppDetailsRes>('/visit/getAppDetails', data)
}
