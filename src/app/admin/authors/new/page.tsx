'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Institution {
  id: string
  name: string
  type: string
  country?: string
  city?: string
}

export default function NewAuthorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loadingInstitutions, setLoadingInstitutions] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    orcid: '',
    institutionId: '',
    bio: '',
    homepage: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchInstitutions()
  }, [])

  const fetchInstitutions = async () => {
    try {
      const response = await fetch('/api/v1/institutions?limit=100')
      const data = await response.json()
      if (data.success) {
        setInstitutions(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch institutions:', error)
    } finally {
      setLoadingInstitutions(false)
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '作者姓名是必填项'
    }

    if (!formData.institutionId) {
      newErrors.institutionId = '请选择所属机构'
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址'
    }

    if (formData.orcid && !isValidOrcid(formData.orcid)) {
      newErrors.orcid = '请输入有效的ORCID格式'
    }

    if (formData.homepage && !isValidUrl(formData.homepage)) {
      newErrors.homepage = '请输入有效的网址'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const isValidOrcid = (orcid: string) => {
    // ORCID format: 0000-0000-0000-0000
    const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{4}$/
    return orcidRegex.test(orcid)
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/v1/authors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/authors')
      } else {
        setErrors({ submit: data.message || '创建作者失败' })
      }
    } catch (error) {
      console.error('Failed to create author:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">添加作者</h1>
          <p className="mt-1 text-sm text-gray-500">
            创建新的作者信息
          </p>
        </div>
        <Link
          href="/admin/authors"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          返回列表
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              作者姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入作者姓名"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Institution */}
          <div>
            <label htmlFor="institutionId" className="block text-sm font-medium text-gray-700">
              所属机构 <span className="text-red-500">*</span>
            </label>
            {loadingInstitutions ? (
              <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm text-gray-500">
                加载机构列表中...
              </div>
            ) : (
              <select
                id="institutionId"
                name="institutionId"
                value={formData.institutionId}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                  errors.institutionId ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">请选择机构</option>
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name} ({institution.type === 'UNIVERSITY' ? '大学' : institution.type === 'RESEARCH_INSTITUTE' ? '研究所' : '企业'})
                    {institution.city && institution.country && ` - ${institution.city}, ${institution.country}`}
                  </option>
                ))}
              </select>
            )}
            {errors.institutionId && (
              <p className="mt-1 text-sm text-red-600">{errors.institutionId}</p>
            )}
            {institutions.length === 0 && !loadingInstitutions && (
              <p className="mt-1 text-sm text-gray-500">
                暂无机构，请先
                <Link href="/admin/institutions/new" className="text-purple-600 hover:text-purple-500 ml-1">
                  创建机构
                </Link>
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              邮箱地址
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="author@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* ORCID */}
          <div>
            <label htmlFor="orcid" className="block text-sm font-medium text-gray-700">
              ORCID
            </label>
            <input
              type="text"
              id="orcid"
              name="orcid"
              value={formData.orcid}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                errors.orcid ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0000-0000-0000-0000"
            />
            {errors.orcid && (
              <p className="mt-1 text-sm text-red-600">{errors.orcid}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              ORCID格式：0000-0000-0000-0000
            </p>
          </div>

          {/* Homepage */}
          <div>
            <label htmlFor="homepage" className="block text-sm font-medium text-gray-700">
              个人主页
            </label>
            <input
              type="url"
              id="homepage"
              name="homepage"
              value={formData.homepage}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm ${
                errors.homepage ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
            />
            {errors.homepage && (
              <p className="mt-1 text-sm text-red-600">{errors.homepage}</p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              个人简介
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              value={formData.bio}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="输入作者的个人简介和研究方向..."
            />
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
              href="/admin/authors"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading || loadingInstitutions}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                '创建作者'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
