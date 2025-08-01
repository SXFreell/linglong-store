/**
 * API 相关常量定义
 */

// HTTP 状态码
export const HTTP_STATUS = {
  // 成功状态码
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // 重定向状态码
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // 客户端错误状态码
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // 服务器错误状态码
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const

// 业务状态码
export const BUSINESS_CODE = {
  SUCCESS: 0,
  UNKNOWN_ERROR: -1,
  NETWORK_ERROR: -2,
  TIMEOUT_ERROR: -3,
  CANCELED_ERROR: -4,
  PARSE_ERROR: -5,
} as const

// 默认配置
export const DEFAULT_CONFIG = {
  // 默认超时时间（毫秒）
  TIMEOUT: 10000,
  // 默认重试次数
  RETRY_COUNT: 2,
  // 默认重试延迟（毫秒）
  RETRY_DELAY: 1000,
  // 默认内容类型
  CONTENT_TYPE: 'application/json',
  // 默认字符编码
  CHARSET: 'utf-8',
} as const

// 错误信息
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '网络连接失败，请检查网络设置',
  TIMEOUT_ERROR: '请求超时，请稍后重试',
  SERVER_ERROR: '服务器错误，请稍后重试',
  UNKNOWN_ERROR: '未知错误，请稍后重试',
  CANCELED_ERROR: '请求已取消',
  PARSE_ERROR: '数据解析失败',
  FORBIDDEN: '权限不足，请联系管理员',
  UNAUTHORIZED: '登录已过期，请重新登录',
  NOT_FOUND: '请求的资源不存在',
  BAD_REQUEST: '请求参数错误',
  TOO_MANY_REQUESTS: '请求过于频繁，请稍后重试',
  SERVICE_UNAVAILABLE: '服务暂时不可用，请稍后重试',
} as const

// 内容类型
export const CONTENT_TYPES = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
  TEXT: 'text/plain',
  HTML: 'text/html',
  XML: 'application/xml',
  STREAM: 'application/octet-stream',
} as const

// 请求头常量
export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  ACCEPT: 'Accept',
  USER_AGENT: 'User-Agent',
  X_REQUESTED_WITH: 'X-Requested-With',
  CACHE_CONTROL: 'Cache-Control',
} as const

// 环境变量
export const ENV = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const
