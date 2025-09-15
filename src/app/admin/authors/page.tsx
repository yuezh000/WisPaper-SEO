'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Author {
  id: string
  name: string
  email?: string
  orcid?: string
  institution: {
    id: string
    name: string
    type: string
    country?: string
    city?: string
  }
  bio?: string
  homepage?: string
  paper_count: number
  created_at: string
}

interface AuthorsResponse {
  success: boolean
  data: Author[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AuthorsManagement() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [institutionFilter, setInstitutionFilter] = useState('')

  useEffect(() => {
    fetchAuthors()
  }, [pagination.page, searchTerm, institutionFilter])

  const fetchAuthors = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (institutionFilter) params.append('institution_id', institutionFilter)

      const response = await fetch(`/api/v1/authors?${params}`)
      const data: AuthorsResponse = await response.json()
      
      if (data.success) {
        setAuthors(data.data)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Failed to fetch authors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getInstitutionTypeBadge = (type: string) => {
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
          <h1 className="text-2xl font-bold text-gray-900">作者管理</h1>
          <p className="mt-1 text-sm text-gray-500">
            管理作者信息，共 {pagination.total} 位作者
          </p>
        </div>
        <Link
          href="/admin/authors/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
        >
          添加作者
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">
                搜索作者
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="输入姓名、邮箱或ORCID..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>
            <div>
              <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                机构筛选
              </label>
              <input
                type="text"
                id="institution"
                value={institutionFilter}
                onChange={(e) => setInstitutionFilter(e.target.value)}
                placeholder="输入机构ID..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                搜索
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Authors Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : authors.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">暂无作者</h3>
            <p className="mt-1 text-sm text-gray-500">开始添加第一位作者吧！</p>
            <div className="mt-6">
              <Link
                href="/admin/authors/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                添加作者
              </Link>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {authors.map((author) => (
              <li key={author.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {author.name}
                        </h3>
                        {author.orcid && (
                          <span className="text-sm text-gray-500">ORCID: {author.orcid}</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          {author.institution.name}
                        </span>
                        {getInstitutionTypeBadge(author.institution.type)}
                        {author.institution.country && (
                          <span className="text-sm text-gray-500">
                            {author.institution.city}, {author.institution.country}
                          </span>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {author.bio || '暂无简介'}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        {author.email && (
                          <span>邮箱: {author.email}</span>
                        )}
                        {author.homepage && (
                          <a
                            href={author.homepage}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-500"
                          >
                            个人主页
                          </a>
                        )}
                        <span>论文数: {author.paper_count}</span>
                        <span>创建时间: {formatDate(author.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/admin/authors/${author.id}`}
                        className="text-purple-600 hover:text-purple-500 text-sm font-medium"
                      >
                        查看
                      </Link>
                      <Link
                        href={`/admin/authors/${author.id}/edit`}
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
