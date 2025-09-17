'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// Removed JournalStatus enum import - now using string type

export default function NewJournalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    acronym: '',
    issn: '',
    eissn: '',
    description: '',
    website: '',
    publisher: '',
    impactFactor: '',
    status: 'ACTIVE'
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

    if (!formData.name.trim()) {
      newErrors.name = '期刊名称是必填项'
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = '请输入有效的网址'
    }

    if (formData.issn && !isValidIssn(formData.issn)) {
      newErrors.issn = '请输入有效的ISSN格式'
    }

    if (formData.eissn && !isValidIssn(formData.eissn)) {
      newErrors.eissn = '请输入有效的e-ISSN格式'
    }

    if (formData.impactFactor && !isValidImpactFactor(formData.impactFactor)) {
      newErrors.impactFactor = '请输入有效的数字'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const isValidIssn = (issn: string) => {
    // ISSN format: 1234-5678
    const issnRegex = /^\d{4}-\d{4}$/
    return issnRegex.test(issn)
  }

  const isValidImpactFactor = (factor: string) => {
    const num = parseFloat(factor)
    return !isNaN(num) && num >= 0
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
        issn: formData.issn || null,
        eissn: formData.eissn || null,
        impactFactor: formData.impactFactor ? parseFloat(formData.impactFactor) : null
      }

      const response = await fetch('/api/v1/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/journals')
      } else {
        setErrors({ submit: data.message || '创建期刊失败' })
      }
    } catch (error) {
      console.error('Failed to create journal:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">添加期刊</h1>
          <p className="mt-1 text-sm text-gray-500">
            创建新的学术期刊信息
          </p>
        </div>
        <Link
          href="/admin/journals"
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
              期刊名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入期刊名称"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Acronym */}
          <div>
            <label htmlFor="acronym" className="block text-sm font-medium text-gray-700">
              期刊简称
            </label>
            <input
              type="text"
              id="acronym"
              name="acronym"
              value={formData.acronym}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="输入期刊简称"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              期刊状态 <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
            >
              <option value="ACTIVE">活跃</option>
              <option value="INACTIVE">非活跃</option>
              <option value="SUSPENDED">暂停</option>
            </select>
          </div>

          {/* ISSN Fields */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="issn" className="block text-sm font-medium text-gray-700">
                ISSN
              </label>
              <input
                type="text"
                id="issn"
                name="issn"
                value={formData.issn}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm ${
                  errors.issn ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1234-5678"
              />
              {errors.issn && (
                <p className="mt-1 text-sm text-red-600">{errors.issn}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                ISSN格式：1234-5678
              </p>
            </div>

            <div>
              <label htmlFor="eissn" className="block text-sm font-medium text-gray-700">
                e-ISSN
              </label>
              <input
                type="text"
                id="eissn"
                name="eissn"
                value={formData.eissn}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm ${
                  errors.eissn ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1234-5678"
              />
              {errors.eissn && (
                <p className="mt-1 text-sm text-red-600">{errors.eissn}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                e-ISSN格式：1234-5678
              </p>
            </div>
          </div>

          {/* Publisher */}
          <div>
            <label htmlFor="publisher" className="block text-sm font-medium text-gray-700">
              出版商
            </label>
            <input
              type="text"
              id="publisher"
              name="publisher"
              value={formData.publisher}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="输入出版商名称"
            />
          </div>

          {/* Impact Factor */}
          <div>
            <label htmlFor="impactFactor" className="block text-sm font-medium text-gray-700">
              影响因子
            </label>
            <input
              type="number"
              id="impactFactor"
              name="impactFactor"
              value={formData.impactFactor}
              onChange={handleInputChange}
              step="0.001"
              min="0"
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm ${
                errors.impactFactor ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入影响因子"
            />
            {errors.impactFactor && (
              <p className="mt-1 text-sm text-red-600">{errors.impactFactor}</p>
            )}
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              期刊官网
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm ${
                errors.website ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://journal.example.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              期刊描述
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
              placeholder="输入期刊描述和主题领域..."
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
              href="/admin/journals"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                '创建期刊'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
