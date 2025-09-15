'use client'

import { useState } from 'react'

interface SearchResult {
  papers: Array<{
    id: string
    title: string
    abstract?: string
    doi?: string
    arxiv_id?: string
    publication_date?: string
    authors: Array<{
      id: string
      name: string
      institution: {
        name: string
      }
    }>
    conference?: {
      name: string
    }
    keywords: string[]
    created_at: string
  }>
  authors: Array<{
    id: string
    name: string
    email?: string
    orcid?: string
    institution: {
      name: string
      type: string
    }
    paper_count: number
    created_at: string
  }>
  conferences: Array<{
    id: string
    name: string
    acronym?: string
    description?: string
    website?: string
    conference_date?: string
    venue?: {
      name: string
      city: string
      country: string
    }
    status: string
    paper_count: number
    created_at: string
  }>
  total: number
}

export default function SearchManagement() {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        type: searchType
      })

      const response = await fetch(`/api/v1/search?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.data)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">搜索管理</h1>
        <p className="mt-1 text-sm text-gray-500">
          全文搜索论文、作者和会议信息
        </p>
      </div>

      {/* Search Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700">
                搜索关键词
              </label>
              <input
                type="text"
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="输入搜索关键词..."
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                搜索类型
              </label>
              <select
                id="type"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                <option value="all">全部</option>
                <option value="papers">论文</option>
                <option value="authors">作者</option>
                <option value="conferences">会议</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? '搜索中...' : '搜索'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Search Results */}
      {results && (
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              搜索结果
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{results.papers.length}</div>
                <div className="text-sm text-blue-600">论文</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{results.authors.length}</div>
                <div className="text-sm text-purple-600">作者</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{results.conferences.length}</div>
                <div className="text-sm text-green-600">会议</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">{results.total}</div>
                <div className="text-sm text-gray-600">总计</div>
              </div>
            </div>
          </div>

          {/* Papers Results */}
          {results.papers.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">论文结果</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {results.papers.map((paper) => (
                  <li key={paper.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {paper.title}
                        </h4>
                        <div className="mt-1 flex items-center text-sm text-gray-500 space-x-4">
                          {paper.doi && <span>DOI: {paper.doi}</span>}
                          {paper.arxiv_id && <span>arXiv: {paper.arxiv_id}</span>}
                          <span>作者: {paper.authors.map(a => a.name).join(', ')}</span>
                          {paper.conference && <span>会议: {paper.conference.name}</span>}
                        </div>
                        {paper.abstract && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {paper.abstract}
                          </p>
                        )}
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span>关键词: {paper.keywords.join(', ')}</span>
                          <span className="ml-4">创建时间: {formatDate(paper.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Authors Results */}
          {results.authors.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">作者结果</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {results.authors.map((author) => (
                  <li key={author.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {author.name}
                        </h4>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {author.institution.name}
                          </span>
                          {getInstitutionTypeBadge(author.institution.type)}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                          {author.email && <span>邮箱: {author.email}</span>}
                          {author.orcid && <span>ORCID: {author.orcid}</span>}
                          <span>论文数: {author.paper_count}</span>
                          <span>创建时间: {formatDate(author.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conferences Results */}
          {results.conferences.length > 0 && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">会议结果</h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {results.conferences.map((conference) => (
                  <li key={conference.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {conference.name}
                          </h4>
                          {conference.acronym && (
                            <span className="text-sm text-gray-500">({conference.acronym})</span>
                          )}
                          {getStatusBadge(conference.status)}
                        </div>
                        {conference.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {conference.description}
                          </p>
                        )}
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
                          <span>创建时间: {formatDate(conference.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No Results */}
          {results.total === 0 && (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">未找到结果</h3>
              <p className="mt-1 text-sm text-gray-500">
                尝试使用不同的关键词或搜索类型
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
