'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// Removed PaperStatus enum import - now using string type

interface Author {
  id: string
  name: string
  institution: {
    name: string
  }
}

interface Conference {
  id: string
  name: string
  acronym?: string
}

interface Journal {
  id: string
  name: string
  acronym?: string
}

export default function NewPaperPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [authors, setAuthors] = useState<Author[]>([])
  const [conferences, setConferences] = useState<Conference[]>([])
  const [journals, setJournals] = useState<Journal[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    doi: '',
    arxivId: '',
    pdfUrl: '',
    publicationDate: '',
    conferenceId: '',
    journalId: '',
    venue: '',
    pages: '',
    volume: '',
    issue: '',
    status: 'DRAFT',
    seoScore: ''
  })
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [authorsRes, conferencesRes, journalsRes] = await Promise.all([
        fetch('/api/v1/authors?limit=100'),
        fetch('/api/v1/conferences?limit=100'),
        fetch('/api/v1/journals?limit=100')
      ])

      const [authorsData, conferencesData, journalsData] = await Promise.all([
        authorsRes.json(),
        conferencesRes.json(),
        journalsRes.json()
      ])

      if (authorsData.success) setAuthors(authorsData.data)
      if (conferencesData.success) setConferences(conferencesData.data)
      if (journalsData.success) setJournals(journalsData.data)
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAuthorToggle = (authorId: string) => {
    setSelectedAuthors(prev => 
      prev.includes(authorId) 
        ? prev.filter(id => id !== authorId)
        : [...prev, authorId]
    )
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '论文标题是必填项'
    }

    if (selectedAuthors.length === 0) {
      newErrors.authors = '请至少选择一位作者'
    }

    if (formData.doi && !isValidDoi(formData.doi)) {
      newErrors.doi = '请输入有效的DOI格式'
    }

    if (formData.arxivId && !isValidArxivId(formData.arxivId)) {
      newErrors.arxivId = '请输入有效的arXiv ID格式'
    }

    if (formData.pdfUrl && !isValidUrl(formData.pdfUrl)) {
      newErrors.pdfUrl = '请输入有效的PDF链接'
    }

    if (formData.seoScore && !isValidSeoScore(formData.seoScore)) {
      newErrors.seoScore = 'SEO评分必须是0-10之间的数字'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidDoi = (doi: string) => {
    // DOI format: 10.1000/182
    const doiRegex = /^10\.\d{4,}\/[^\s]+$/
    return doiRegex.test(doi)
  }

  const isValidArxivId = (arxivId: string) => {
    // arXiv format: 1234.5678 or 1234.5678v1
    const arxivRegex = /^\d{4}\.\d{4}(v\d+)?$/
    return arxivRegex.test(arxivId)
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isValidSeoScore = (score: string) => {
    const num = parseFloat(score)
    return !isNaN(num) && num >= 0 && num <= 10
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
        doi: formData.doi || null,
        arxivId: formData.arxivId || null,
        pdfUrl: formData.pdfUrl || null,
        publicationDate: formData.publicationDate || null,
        conferenceId: formData.conferenceId || null,
        journalId: formData.journalId || null,
        venue: formData.venue || null,
        pages: formData.pages || null,
        volume: formData.volume || null,
        issue: formData.issue || null,
        seoScore: formData.seoScore ? parseFloat(formData.seoScore) : null,
        authors: selectedAuthors
      }

      const response = await fetch('/api/v1/papers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/papers')
      } else {
        setErrors({ submit: data.message || '创建论文失败' })
      }
    } catch (error) {
      console.error('Failed to create paper:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">添加论文</h1>
          <p className="mt-1 text-sm text-gray-500">
            创建新的学术论文信息
          </p>
        </div>
        <Link
          href="/admin/papers"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          返回列表
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              论文标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入论文标题"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Abstract */}
          <div>
            <label htmlFor="abstract" className="block text-sm font-medium text-gray-700">
              摘要
            </label>
            <textarea
              id="abstract"
              name="abstract"
              rows={6}
              value={formData.abstract}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="输入论文摘要..."
            />
          </div>

          {/* Authors */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              作者 <span className="text-red-500">*</span>
            </label>
            {loadingData ? (
              <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm text-gray-500">
                加载作者列表中...
              </div>
            ) : (
              <div className="mt-1 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
                {authors.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    暂无作者，请先
                    <Link href="/admin/authors/new" className="text-blue-600 hover:text-blue-500 ml-1">
                      创建作者
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {authors.map((author) => (
                      <label key={author.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedAuthors.includes(author.id)}
                          onChange={() => handleAuthorToggle(author.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {author.name} ({author.institution.name})
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
            {errors.authors && (
              <p className="mt-1 text-sm text-red-600">{errors.authors}</p>
            )}
            {selectedAuthors.length > 0 && (
              <p className="mt-1 text-sm text-gray-500">
                已选择 {selectedAuthors.length} 位作者
              </p>
            )}
          </div>

          {/* Identifiers */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="doi" className="block text-sm font-medium text-gray-700">
                DOI
              </label>
              <input
                type="text"
                id="doi"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.doi ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="10.1000/182"
              />
              {errors.doi && (
                <p className="mt-1 text-sm text-red-600">{errors.doi}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                DOI格式：10.1000/182
              </p>
            </div>

            <div>
              <label htmlFor="arxivId" className="block text-sm font-medium text-gray-700">
                arXiv ID
              </label>
              <input
                type="text"
                id="arxivId"
                name="arxivId"
                value={formData.arxivId}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.arxivId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1234.5678"
              />
              {errors.arxivId && (
                <p className="mt-1 text-sm text-red-600">{errors.arxivId}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                arXiv格式：1234.5678
              </p>
            </div>
          </div>

          {/* Publication Info */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="conferenceId" className="block text-sm font-medium text-gray-700">
                会议
              </label>
              <select
                id="conferenceId"
                name="conferenceId"
                value={formData.conferenceId}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">请选择会议</option>
                {conferences.map((conference) => (
                  <option key={conference.id} value={conference.id}>
                    {conference.name} {conference.acronym && `(${conference.acronym})`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="journalId" className="block text-sm font-medium text-gray-700">
                期刊
              </label>
              <select
                id="journalId"
                name="journalId"
                value={formData.journalId}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">请选择期刊</option>
                {journals.map((journal) => (
                  <option key={journal.id} value={journal.id}>
                    {journal.name} {journal.acronym && `(${journal.acronym})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Publication Details */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
            <div>
              <label htmlFor="publicationDate" className="block text-sm font-medium text-gray-700">
                发表日期
              </label>
              <input
                type="date"
                id="publicationDate"
                name="publicationDate"
                value={formData.publicationDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="volume" className="block text-sm font-medium text-gray-700">
                卷号
              </label>
              <input
                type="text"
                id="volume"
                name="volume"
                value={formData.volume}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="卷号"
              />
            </div>

            <div>
              <label htmlFor="issue" className="block text-sm font-medium text-gray-700">
                期号
              </label>
              <input
                type="text"
                id="issue"
                name="issue"
                value={formData.issue}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="期号"
              />
            </div>

            <div>
              <label htmlFor="pages" className="block text-sm font-medium text-gray-700">
                页码
              </label>
              <input
                type="text"
                id="pages"
                name="pages"
                value={formData.pages}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="1-10"
              />
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-gray-700">
                发表场所
              </label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="输入发表场所"
              />
            </div>

            <div>
              <label htmlFor="pdfUrl" className="block text-sm font-medium text-gray-700">
                PDF链接
              </label>
              <input
                type="url"
                id="pdfUrl"
                name="pdfUrl"
                value={formData.pdfUrl}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.pdfUrl ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="https://example.com/paper.pdf"
              />
              {errors.pdfUrl && (
                <p className="mt-1 text-sm text-red-600">{errors.pdfUrl}</p>
              )}
            </div>
          </div>

          {/* Status and SEO */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                论文状态 <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="DRAFT">草稿</option>
                <option value="PUBLISHED">已发布</option>
                <option value="ARCHIVED">已归档</option>
              </select>
            </div>

            <div>
              <label htmlFor="seoScore" className="block text-sm font-medium text-gray-700">
                SEO评分
              </label>
              <input
                type="number"
                id="seoScore"
                name="seoScore"
                value={formData.seoScore}
                onChange={handleInputChange}
                step="0.1"
                min="0"
                max="10"
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.seoScore ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0-10"
              />
              {errors.seoScore && (
                <p className="mt-1 text-sm text-red-600">{errors.seoScore}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                SEO评分范围：0-10
              </p>
            </div>
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
              href="/admin/papers"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || loadingData}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                '创建论文'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
