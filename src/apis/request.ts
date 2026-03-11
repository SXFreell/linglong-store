/**
 * 基于 alova 的最简单请求封装
 */

import { createAlova, RequestBody } from 'alova'
import adapterFetch from 'alova/fetch'
import ReactHook from 'alova/react'

const baseURL = import.meta.env.VITE_SERVER_URL
// [错误处理] 添加环境变量校验，避免运行时因配置缺失导致难以定位的错误
if (!baseURL) {
  console.error('[Request] VITE_SERVER_URL is not configured')
}

// 创建 alova 实例
const alovaInstance = createAlova({
  baseURL,
  statesHook: ReactHook,
  requestAdapter: adapterFetch(),
  timeout: 10000,
  // GET 请求默认 5 分钟内存缓存，避免短时间内的重复请求
  cacheFor: {
    GET: 5 * 60 * 1000,
    POST: 0 as const,
    PUT: 0 as const,
    DELETE: 0 as const,
  },
  beforeRequest(method) {
    const isFormData = typeof FormData !== 'undefined' && method.data instanceof FormData
    if (!isFormData) {
      // 设置默认请求头
      method.config.headers = {
        'Content-Type': 'application/json',
        ...method.config.headers,
      }
    } else if (method.config.headers) {
      delete (method.config.headers as Record<string, string>)['Content-Type']
    }
  },
  responded: {
    onSuccess: async(response) => {
      let data
      // [错误处理] 添加 JSON 解析错误处理，防止响应不是有效 JSON 时抛出未捕获异常
      try {
        data = await response.json()
      } catch {
        throw new Error(`响应解析失败: ${response.status} ${response.statusText}`)
      }
      if (!response.ok) {
        throw new Error(data.message || '请求失败')
      }
      // [业务逻辑] 使用 !== undefined 检查 code 是否存在，避免 code=0 时被错误跳过
      if (data.code !== undefined && data.code !== 200) {
        throw new Error(data.message || `请求失败，错误码[${data.code}]`)
      }
      return data
    },
    onError: (error) => {
      console.error('请求错误:', error.message)
      throw error
    },
  },
})

// 请求类
export class Request {
  private alova = alovaInstance

  // GET 请求
  async get<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const method = this.alova.Get(url, config)
    return method.send() as Promise<T>
  }

  // POST 请求
  async post<T>(
    url: string,
    data?: RequestBody | undefined,
    config?: Record<string, unknown>,
  ): Promise<T> {
    const method = this.alova.Post(url, data, config)
    return method.send() as Promise<T>
  }

  // PUT 请求
  async put<T>(
    url: string,
    data?: RequestBody | undefined,
    config?: Record<string, unknown>,
  ): Promise<T> {
    const method = this.alova.Put(url, data, config)
    return method.send() as Promise<T>
  }

  // DELETE 请求
  async delete<T>(url: string, config?: Record<string, unknown>): Promise<T> {
    const method = this.alova.Delete(url, config)
    return method.send() as Promise<T>
  }

  // PATCH 请求
  async patch<T>(
    url: string,
    data?: RequestBody | undefined,
    config?: Record<string, unknown>,
  ): Promise<T> {
    const method = this.alova.Patch(url, data, config)
    return method.send() as Promise<T>
  }

  // 文件上传
  async upload<T>(
    url: string,
    file: File,
    name = 'file',
    data?: Record<string, unknown>,
  ): Promise<T> {
    const formData = new FormData()
    formData.append(name, file)

    // 添加其他字段
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value))
      })
    }

    const method = this.alova.Post(url, formData, {
      headers: {
        // 不设置 Content-Type，让浏览器自动设置
      },
    })

    return method.send() as Promise<T>
  }

  // 分页请求
  async paginate<T>(
    url: string,
    page = 1,
    pageSize = 10,
    params?: Record<string, unknown>,
  ): Promise<T> {
    return this.get<T>(url, {
      params: {
        page,
        pageSize,
        ...params,
      },
    })
  }

  // 设置基础 URL
  setBaseURL(baseURL: string) {
    this.alova.options.baseURL = baseURL
  }

  // 设置默认头部
  setHeaders(headers: Record<string, string>) {
    const originalBeforeRequest = this.alova.options.beforeRequest
    this.alova.options.beforeRequest = (method) => {
      method.config.headers = {
        ...headers,
        ...method.config.headers,
      }
      if (originalBeforeRequest) {
        originalBeforeRequest(method)
      }
    }
  }
}

// 创建默认实例
export const request = new Request()

// 便捷方法
export const get = request.get.bind(request)
export const post = request.post.bind(request)
export const put = request.put.bind(request)
export const del = request.delete.bind(request)
export const patch = request.patch.bind(request)
export const upload = request.upload.bind(request)
export const paginate = request.paginate.bind(request)

// 创建自定义实例
export function createRequest(baseURL?: string, headers?: Record<string, string>) {
  const instance = new Request()
  if (baseURL) {
    instance.setBaseURL(baseURL)
  }
  if (headers) {
    instance.setHeaders(headers)
  }
  return instance
}

// 导出类型和常量
export * from './types'
