'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Task {
  id: string
  type: string
  status: string
  priority: number
  payload: any
  result?: any
  error_message?: string
  retry_count: number
  max_retries: number
  scheduled_at?: string
  started_at?: string
  completed_at?: string
  log_count: number
  created_at: string
  updated_at: string
}

interface TasksResponse {
  success: boolean
  data: Task[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function TasksManagement() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchTasks()
  }, [pagination.page, typeFilter, statusFilter])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (typeFilter) params.append('type', typeFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/v1/tasks?${params}`)
      const data: TasksResponse = await response.json()
      
      if (data.success) {
        setTasks(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      CRAWL: { color: 'bg-blue-100 text-blue-800', label: '爬虫' },
      PARSE_PDF: { color: 'bg-green-100 text-green-800', label: 'PDF解析' },
      GENERATE_ABSTRACT: { color: 'bg-purple-100 text-purple-800', label: '摘要生成' },
      INDEX_PAGE: { color: 'bg-yellow-100 text-yellow-800', label: '页面索引' }
    }
    const typeInfo = typeMap[type as keyof typeof typeMap] || { color: 'bg-gray-100 text-gray-800', label: type }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { color: 'bg-gray-100 text-gray-800', label: '等待中' },
      RUNNING: { color: 'bg-blue-100 text-blue-800', label: '运行中' },
      COMPLETED: { color: 'bg-green-100 text-green-800', label: '已完成' },
      FAILED: { color: 'bg-red-100 text-red-800', label: '失败' }
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.PENDING
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const getPriorityBadge = (priority: number) => {
    if (priority >= 8) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">高</span>
    } else if (priority >= 5) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">中</span>
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">低</span>
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未设置'
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return '-'
    const start = new Date(startedAt)
    const end = completedAt ? new Date(completedAt) : new Date()
    const duration = Math.round((end.getTime() - start.getTime()) / 1000)
    
    if (duration < 60) return `${duration}秒`
    if (duration < 3600) return `${Math.round(duration / 60)}分钟`
    return `${Math.round(duration / 3600)}小时`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">任务管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理系统任务，共 {pagination.total} 个任务
          </p>
        </div>
        <Link
          href="/admin/tasks/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
        >
          创建任务
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">
              任务类型
            </label>
            <select
              id="type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
            >
              <option value="">全部类型</option>
              <option value="CRAWL">爬虫</option>
              <option value="PARSE_PDF">PDF解析</option>
              <option value="GENERATE_ABSTRACT">摘要生成</option>
              <option value="INDEX_PAGE">页面索引</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              任务状态
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
            >
              <option value="">全部状态</option>
              <option value="PENDING">等待中</option>
              <option value="RUNNING">运行中</option>
              <option value="COMPLETED">已完成</option>
              <option value="FAILED">失败</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setTypeFilter('')
                setStatusFilter('')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无任务</h3>
            <p className="mt-1 text-sm text-gray-500">开始创建第一个任务吧！</p>
            <div className="mt-6">
              <Link
                href="/admin/tasks/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
              >
                创建任务
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {tasks.map((task) => (
              <li key={task.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          任务 #{task.id.slice(0, 8)}
                        </h3>
                        {getTypeBadge(task.type)}
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>重试: {task.retry_count}/{task.max_retries}</span>
                        <span>日志: {task.log_count}条</span>
                        {task.scheduled_at && (
                          <span>计划: {formatDate(task.scheduled_at)}</span>
                        )}
                        {task.started_at && (
                          <span>开始: {formatDate(task.started_at)}</span>
                        )}
                        {task.completed_at && (
                          <span>完成: {formatDate(task.completed_at)}</span>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <strong>参数:</strong> {JSON.stringify(task.payload, null, 2).slice(0, 200)}
                          {JSON.stringify(task.payload).length > 200 && '...'}
                        </p>
                      </div>
                      {task.error_message && (
                        <div className="mt-2">
                          <p className="text-sm text-red-600">
                            <strong>错误:</strong> {task.error_message}
                          </p>
                        </div>
                      )}
                      {task.result && (
                        <div className="mt-2">
                          <p className="text-sm text-green-600">
                            <strong>结果:</strong> {JSON.stringify(task.result, null, 2).slice(0, 200)}
                            {JSON.stringify(task.result).length > 200 && '...'}
                          </p>
                        </div>
                      )}
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>创建时间: {formatDate(task.created_at)}</span>
                        <span>更新时间: {formatDate(task.updated_at)}</span>
                        {task.started_at && (
                          <span>执行时长: {getDuration(task.started_at, task.completed_at)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/tasks/${task.id}`}
                        className="text-yellow-600 hover:text-yellow-500 text-sm font-medium"
                      >
                        查看详情
                      </Link>
                      <Link
                        href={`/admin/tasks/${task.id}/logs`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        查看日志
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              上一页
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              下一页
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                显示第 <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> 到{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                条，共 <span className="font-medium">{pagination.total}</span> 条结果
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  上一页
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
