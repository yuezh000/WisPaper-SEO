'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Journal {
  id: string
  name: string
  acronym?: string
  issn?: string
  eissn?: string
  description?: string
  website?: string
  publisher?: string
  impact_factor?: number
  status: string
  paper_count: number
  created_at: string
  updated_at: string
}

interface JournalsResponse {
  success: boolean
  data: Journal[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function JournalsManagement() {
  const [journals, setJournals] = useState<Journal[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [publisherFilter, setPublisherFilter] = useState('')

  useEffect(() => {
    fetchJournals()
  }, [pagination.page, searchTerm, statusFilter, publisherFilter])

  const fetchJournals = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (publisherFilter) params.append('publisher', publisherFilter)

      const response = await fetch(`/api/v1/journals?${params}`)
      const data: JournalsResponse = await response.json()
      
      if (data.success) {
        setJournals(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch journals:', error)
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
      ACTIVE: { color: 'bg-green-100 text-green-800', label: '活跃' },
      INACTIVE: { color: 'bg-gray-100 text-gray-800', label: '停刊' },
      SUSPENDED: { color: 'bg-yellow-100 text-yellow-800', label: '暂停' }
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.ACTIVE
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const getImpactFactorBadge = (impactFactor?: number) => {
    if (!impactFactor) return null
    
    let color = 'bg-gray-100 text-gray-800'
    if (impactFactor >= 10) color = 'bg-red-100 text-red-800'
    else if (impactFactor >= 5) color = 'bg-orange-100 text-orange-800'
    else if (impactFactor >= 2) color = 'bg-yellow-100 text-yellow-800'
    else if (impactFactor >= 1) color = 'bg-green-100 text-green-800'

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        IF: {impactFactor.toFixed(2)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">期刊管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理学术期刊信息，共 {pagination.total} 个期刊
          </p>
        </div>
        <Link
          href="/admin/journals/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
        >
          添加期刊
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                搜索期刊
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入期刊名称、ISSN或出版商..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
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
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              >
                <option value="">全部状态</option>
                <option value="ACTIVE">活跃</option>
                <option value="INACTIVE">停刊</option>
                <option value="SUSPENDED">暂停</option>
              </select>
            </div>
            <div>
              <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">
                出版商筛选
              </label>
              <input
                type="text"
                id="publisher"
                value={publisherFilter}
                onChange={(e) => setPublisherFilter(e.target.value)}
                placeholder="输入出版商名称..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                搜索
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Journals Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : journals.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无期刊</h3>
            <p className="mt-1 text-sm text-gray-500">开始添加第一个期刊吧！</p>
            <div className="mt-6">
              <Link
                href="/admin/journals/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
              >
                添加期刊
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {journals.map((journal) => (
              <li key={journal.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {journal.name}
                        </h3>
                        {journal.acronym && (
                          <span className="text-sm text-gray-500">({journal.acronym})</span>
                        )}
                        {getStatusBadge(journal.status)}
                        {getImpactFactorBadge(journal.impact_factor)}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {journal.description || '暂无描述'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        {journal.issn && <span>ISSN: {journal.issn}</span>}
                        {journal.eissn && <span>eISSN: {journal.eissn}</span>}
                        {journal.publisher && <span>出版商: {journal.publisher}</span>}
                        <span>论文数: {journal.paper_count}</span>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        {journal.website && (
                          <a
                            href={journal.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            🌐 官网
                          </a>
                        )}
                        <span>创建时间: {formatDate(journal.created_at)}</span>
                        <span>更新时间: {formatDate(journal.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/journals/${journal.id}`}
                        className="text-orange-600 hover:text-orange-500 text-sm font-medium"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/admin/journals/${journal.id}/edit`}
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
