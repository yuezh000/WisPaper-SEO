'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { TaskType, TaskStatus } from '@/generated/prisma'

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: TaskType.CRAWL,
    status: TaskStatus.PENDING,
    priority: '5',
    payload: '',
    maxRetries: '3',
    scheduledAt: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.payload.trim()) {
      newErrors.payload = '任务参数是必填项'
    }

    // Validate JSON payload
    if (formData.payload.trim()) {
      try {
        JSON.parse(formData.payload)
      } catch {
        newErrors.payload = '任务参数必须是有效的JSON格式'
      }
    }

    const priority = parseInt(formData.priority)
    if (isNaN(priority) || priority < 1 || priority > 10) {
      newErrors.priority = '优先级必须是1-10之间的数字'
    }

    const maxRetries = parseInt(formData.maxRetries)
    if (isNaN(maxRetries) || maxRetries < 0 || maxRetries > 10) {
      newErrors.maxRetries = '最大重试次数必须是0-10之间的数字'
    }

    if (formData.scheduledAt) {
      const scheduledDate = new Date(formData.scheduledAt)
      if (scheduledDate <= new Date()) {
        newErrors.scheduledAt = '计划执行时间必须是未来时间'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getTaskTypeDescription = (type: TaskType) => {
    const descriptions = {
      [TaskType.CRAWL]: '爬取网页内容，参数示例：{"url": "https://example.com", "selector": ".content"}',
      [TaskType.PARSE_PDF]: '解析PDF文档，参数示例：{"pdfUrl": "https://example.com/paper.pdf", "extractText": true}',
      [TaskType.GENERATE_ABSTRACT]: '生成论文摘要，参数示例：{"paperId": "uuid", "language": "en"}',
      [TaskType.INDEX_PAGE]: '索引页面内容，参数示例：{"pageId": "uuid", "content": "page content"}'
    }
    return descriptions[type] || ''
  }

  const getDefaultPayload = (type: TaskType) => {
    const defaults = {
      [TaskType.CRAWL]: '{\n  "url": "https://example.com",\n  "selector": ".content"\n}',
      [TaskType.PARSE_PDF]: '{\n  "pdfUrl": "https://example.com/paper.pdf",\n  "extractText": true\n}',
      [TaskType.GENERATE_ABSTRACT]: '{\n  "paperId": "paper-uuid",\n  "language": "en"\n}',
      [TaskType.INDEX_PAGE]: '{\n  "pageId": "page-uuid",\n  "content": "page content"\n}'
    }
    return defaults[type] || '{}'
  }

  const handleTaskTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as TaskType
    setFormData(prev => ({ 
      ...prev, 
      type: newType,
      payload: getDefaultPayload(newType)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        priority: parseInt(formData.priority),
        maxRetries: parseInt(formData.maxRetries),
        payload: JSON.parse(formData.payload),
        scheduledAt: formData.scheduledAt || null
      }

      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/tasks')
      } else {
        setErrors({ submit: data.message || '创建任务失败' })
      }
    } catch (error) {
      console.error('Failed to create task:', error)
      setErrors({ submit: '网络错误，请重试' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">创建任务</h1>
          <p className="mt-1 text-sm text-gray-500">
            创建新的系统任务
          </p>
        </div>
        <Link
          href="/admin/tasks"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          返回列表
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Task Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              任务类型 <span className="text-red-500">*</span>
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleTaskTypeChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
            >
              <option value={TaskType.CRAWL}>爬虫任务</option>
              <option value={TaskType.PARSE_PDF}>PDF解析</option>
              <option value={TaskType.GENERATE_ABSTRACT}>摘要生成</option>
              <option value={TaskType.INDEX_PAGE}>页面索引</option>
            </select>
            <p className="mt-1 text-sm text-gray-500">
              {getTaskTypeDescription(formData.type)}
            </p>
          </div>

          {/* Task Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              任务状态 <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
            >
              <option value={TaskStatus.PENDING}>等待中</option>
              <option value={TaskStatus.RUNNING}>运行中</option>
              <option value={TaskStatus.COMPLETED}>已完成</option>
              <option value={TaskStatus.FAILED}>失败</option>
            </select>
          </div>

          {/* Priority and Max Retries */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                优先级 <span className="text-red-500">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm ${
                  errors.priority ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="1">1 - 最低</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5 - 普通</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10 - 最高</option>
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority}</p>
              )}
            </div>

            <div>
              <label htmlFor="maxRetries" className="block text-sm font-medium text-gray-700">
                最大重试次数 <span className="text-red-500">*</span>
              </label>
              <select
                id="maxRetries"
                name="maxRetries"
                value={formData.maxRetries}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm ${
                  errors.maxRetries ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="0">0 - 不重试</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3 - 默认</option>
                <option value="5">5</option>
                <option value="10">10 - 最多</option>
              </select>
              {errors.maxRetries && (
                <p className="mt-1 text-sm text-red-600">{errors.maxRetries}</p>
              )}
            </div>
          </div>

          {/* Scheduled At */}
          <div>
            <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700">
              计划执行时间
            </label>
            <input
              type="datetime-local"
              id="scheduledAt"
              name="scheduledAt"
              value={formData.scheduledAt}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm ${
                errors.scheduledAt ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.scheduledAt && (
              <p className="mt-1 text-sm text-red-600">{errors.scheduledAt}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              留空表示立即执行
            </p>
          </div>

          {/* Payload */}
          <div>
            <label htmlFor="payload" className="block text-sm font-medium text-gray-700">
              任务参数 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="payload"
              name="payload"
              rows={8}
              value={formData.payload}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm font-mono ${
                errors.payload ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入JSON格式的任务参数..."
            />
            {errors.payload && (
              <p className="mt-1 text-sm text-red-600">{errors.payload}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              请输入有效的JSON格式参数
            </p>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              href="/admin/tasks"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  创建中...
                </>
              ) : (
                '创建任务'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
