'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Institution {
  id: string
  name: string
  type: string
  country?: string
  city?: string
  website?: string
  author_count: number
  created_at: string
  updated_at: string
}

interface InstitutionsResponse {
  success: boolean
  data: Institution[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function InstitutionsManagement() {
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [countryFilter, setCountryFilter] = useState('')

  useEffect(() => {
    fetchInstitutions()
  }, [pagination.page, searchTerm, typeFilter, countryFilter])

  const fetchInstitutions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (typeFilter) params.append('type', typeFilter)
      if (countryFilter) params.append('country', countryFilter)

      const response = await fetch(`/api/v1/institutions?${params}`)
      const data: InstitutionsResponse = await response.json()
      
      if (data.success) {
        setInstitutions(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getTypeBadge = (type: string) => {
    const typeMap = {
      UNIVERSITY: { color: 'bg-blue-100 text-blue-800', label: '大学' },
      RESEARCH_INSTITUTE: { color: 'bg-green-100 text-green-800', label: '研究所' },
      COMPANY: { color: 'bg-purple-100 text-purple-800', label: '企业' }
    }
    const typeInfo = typeMap[type as keyof typeof typeMap] || typeMap.UNIVERSITY
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.color}`}>
        {typeInfo.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">机构管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理学术机构信息，共 {pagination.total} 个机构
          </p>
        </div>
        <Link
          href="/admin/institutions/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          添加机构
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                搜索机构
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入机构名称、城市或国家..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                机构类型
              </label>
              <select
                id="type"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="">全部类型</option>
                <option value="UNIVERSITY">大学</option>
                <option value="RESEARCH_INSTITUTE">研究所</option>
                <option value="COMPANY">企业</option>
              </select>
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                国家筛选
              </label>
              <input
                type="text"
                id="country"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
                placeholder="输入国家名称..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                搜索
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Institutions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : institutions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无机构</h3>
            <p className="mt-1 text-sm text-gray-500">开始添加第一个机构吧！</p>
            <div className="mt-6">
              <Link
                href="/admin/institutions/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                添加机构
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {institutions.map((institution) => (
              <li key={institution.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {institution.name}
                        </h3>
                        {getTypeBadge(institution.type)}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        {institution.city && institution.country && (
                          <span>📍 {institution.city}, {institution.country}</span>
                        )}
                        <span>👥 作者数: {institution.author_count}</span>
                        {institution.website && (
                          <a
                            href={institution.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            🌐 官网
                          </a>
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>创建时间: {formatDate(institution.created_at)}</span>
                        <span className="ml-4">更新时间: {formatDate(institution.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/institutions/${institution.id}`}
                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/admin/institutions/${institution.id}/edit`}
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
