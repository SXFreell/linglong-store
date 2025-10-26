import { get, post } from '..'

/**
 * 获取应用分类列表
 * @returns 应用分类数组
 */
export const getDisCategoryList = () => {
  return get<API.Common.BaseResponse<API.APP.GetDisCategoryListRes[]>>('/visit/getDisCategoryList')
}

/**
 * 根据查询条件名称或者分类获取玲珑列表(分页)
 * @param data 查询条件
 * @returns 分页应用列表
 */
export const getSearchAppList = (data: API.APP.SearchAppListParams) => {
  return post<API.Common.BaseResponse<API.APP.GetAppListRes>>('/visit/getSearchAppList', data)
}

/**
 * 获取程序的详细信息（包括图标等）
 * @param data 应用详情查询参数数组
 * @returns 应用详情数组
 */
export const getAppDetails = (data: API.APP.AppDetailsVO[]) => {
  return post<API.Common.BaseResponse<API.APP.GetAppDetailsRes>>('/visit/getAppDetails', data)
}

/**
 * 推荐页面 - 获取轮播图列表
 * @param data 轮播图查询参数
 * @returns 轮播图应用列表
 */
export const getWelcomeCarouselList = (data: API.APP.AppWelcomeSearchVO) => {
  return post<API.Common.BaseResponse<API.APP.GetWelcomeCarouselListRes>>('/visit/getWelcomeCarouselList', data)
}

/**
 * 获取最受欢迎的推荐应用列表
 * @param data 查询参数(分页)
 * @returns 分页应用列表
 */
export const getWelcomeAppList = (data: API.APP.AppMainVO) => {
  return post<API.Common.BaseResponse<API.APP.GetAppListRes>>('/visit/getWelcomeAppList', data)
}

/**
 * 获取最新应用列表(按上架时间排序)
 * @param data 查询参数(分页)
 * @returns 分页应用列表
 */
export const getNewAppList = (data: API.APP.AppMainVO) => {
  return post<API.Common.BaseResponse<API.APP.GetAppListRes>>('/visit/getNewAppList', data)
}

/**
 * 获取下载量排行应用列表(按安装量排序)
 * @param data 查询参数(分页)
 * @returns 分页应用列表
 */
export const getInstallAppList = (data: API.APP.AppMainVO) => {
  return post<API.Common.BaseResponse<API.APP.GetAppListRes>>('/visit/getInstallAppList', data)
}

/**
 * 根据appId获取不同版本的程序列表
 * @param data 查询参数
 * @returns 应用版本列表
 */
export const getSearchAppVersionList = (data: API.APP.AppMainVO) => {
  return post<API.Common.BaseResponse<API.APP.GetAppVersionListRes>>('/visit/getSearchAppVersionList', data)
}

/**
 * 新增安装记录
 * @param data 安装记录数据
 * @returns 操作结果
 */
export const saveVisit = (data: API.APP.AppVisitSaveVO) => {
  return post<API.Common.BaseResponse<null>>('/visit/save', data)
}

/**
 * 新增用户登录记录
 * @param data 登录记录数据
 * @returns 操作结果
 */
export const appLogin = (data: API.APP.AppLoginSaveVO) => {
  return post<API.Common.BaseResponse<null>>('/visit/appLogin', data)
}

/**
 * 意见反馈
 * @param data 反馈数据
 * @returns 操作结果
 */
export const suggest = (data: API.APP.AppLoginSaveVO) => {
  return post<API.Common.BaseResponse<null>>('/visit/suggest', data)
}

/**
 * 获取组件源执行脚本
 * @returns Shell脚本字符串
 */
export const findShellString = () => {
  return get<API.Common.BaseResponse<API.APP.GetShellStringRes>>('/app/findShellString')
}

/**
 * 修改组件源执行脚本
 * @param data 配置数据
 * @returns 操作结果
 */
export const updateShellString = (data: API.APP.BaseConfigDtl) => {
  return post<API.Common.BaseResponse<string>>('/app/updateShellString', data)
}
