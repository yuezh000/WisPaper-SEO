'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Conference {
  id: string
  name: string
  acronym?: string
  description?: string
  website?: string
  submission_deadline?: string
  notification_date?: string
  conference_date?: string
  status: string
  paper_count: number
  venue?: {
    name: string
    city: string
    country: string
  }
  created_at: string
}

interface ConferencesResponse {
  success: boolean
  data: Conference[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function ConferencesManagement() {
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    fetchConferences()
  }, [pagination.page, searchTerm, statusFilter])

  const fetchConferences = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/v1/conferences?${params}`)
      const data: ConferencesResponse = await response.json()
      
      if (data.success) {
        setConferences(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch conferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      UPCOMING: { color: 'bg-blue-100 text-blue-800', label: '即将开始' },
      ONGOING: { color: 'bg-green-100 text-green-800', label: '进行中' },
      COMPLETED: { color: 'bg-gray-100 text-gray-800', label: '已结束' }
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.UPCOMING
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '未设置'
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const isUpcoming = (dateString?: string) => {
    if (!dateString) return false
    return new Date(dateString) > new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会议管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理学术会议信息，共 {pagination.total} 个会议
          </p>
        </div>
        <Link
          href="/admin/conferences/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          添加会议
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                搜索会议
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入会议名称、简称或描述..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                状态筛选
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">全部状态</option>
                <option value="UPCOMING">即将开始</option>
                <option value="ONGOING">进行中</option>
                <option value="COMPLETED">已结束</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                搜索
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Conferences Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : conferences.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无会议</h3>
            <p className="mt-1 text-sm text-gray-500">开始添加第一个会议吧！</p>
            <div className="mt-6">
              <Link
                href="/admin/conferences/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                添加会议
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {conferences.map((conference) => (
              <li key={conference.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {conference.name}
                        </h3>
                        {conference.acronym && (
                          <span className="text-sm text-gray-500">({conference.acronym})</span>
                        )}
                        {getStatusBadge(conference.status)}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {conference.description || '暂无描述'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>论文数: {conference.paper_count}</span>
                        {conference.website && (
                          <a
                            href={conference.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            官网
                          </a>
                        )}
                        {conference.venue && (
                          <span>地点: {conference.venue.city}, {conference.venue.country}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span>
                          投稿截止: {formatDate(conference.submission_deadline)}
                          {isUpcoming(conference.submission_deadline) && (
                            <span className="ml-1 text-orange-600">⚠️</span>
                          )}
                        </span>
                        <span>
                          会议日期: {formatDate(conference.conference_date)}
                        </span>
                        <span>
                          创建时间: {formatDate(conference.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/conferences/${conference.id}`}
                        className="text-green-600 hover:text-green-500 text-sm font-medium"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/admin/conferences/${conference.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        编辑
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
