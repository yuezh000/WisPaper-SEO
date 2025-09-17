'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
// Removed ConferenceStatus enum import - now using string type

interface Venue {
  id: string
  name: string
  city: string
  country: string
}

export default function NewConferencePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState<Venue[]>([])
  const [loadingVenues, setLoadingVenues] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    acronym: '',
    description: '',
    website: '',
    submissionDeadline: '',
    notificationDate: '',
    conferenceDate: '',
    venueId: '',
    status: 'UPCOMING'
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/v1/venues?limit=100')
      const data = await response.json()
      if (data.success) {
        setVenues(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch venues:', error)
    } finally {
      setLoadingVenues(false)
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
      newErrors.name = '会议名称是必填项'
    }

    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = '请输入有效的网址'
    }

    if (formData.submissionDeadline && formData.conferenceDate) {
      const submissionDate = new Date(formData.submissionDeadline)
      const conferenceDate = new Date(formData.conferenceDate)
      if (submissionDate >= conferenceDate) {
        newErrors.submissionDeadline = '投稿截止日期必须早于会议日期'
      }
    }

    if (formData.notificationDate && formData.conferenceDate) {
      const notificationDate = new Date(formData.notificationDate)
      const conferenceDate = new Date(formData.conferenceDate)
      if (notificationDate >= conferenceDate) {
        newErrors.notificationDate = '通知日期必须早于会议日期'
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      const submitData = {
        ...formData,
        submissionDeadline: formData.submissionDeadline || null,
        notificationDate: formData.notificationDate || null,
        conferenceDate: formData.conferenceDate || null,
        venueId: formData.venueId || null
      }

      const response = await fetch('/api/v1/conferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      const data = await response.json()

      if (data.success) {
        router.push('/admin/conferences')
      } else {
        setErrors({ submit: data.message || '创建会议失败' })
      }
    } catch (error) {
      console.error('Failed to create conference:', error)
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
          <h1 className="text-2xl font-bold text-gray-900">添加会议</h1>
          <p className="mt-1 text-sm text-gray-500">
            创建新的学术会议信息
          </p>
        </div>
        <Link
          href="/admin/conferences"
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
              会议名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="输入会议名称"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Acronym */}
          <div>
            <label htmlFor="acronym" className="block text-sm font-medium text-gray-700">
              会议简称
            </label>
            <input
              type="text"
              id="acronym"
              name="acronym"
              value={formData.acronym}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="输入会议简称"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              会议状态 <span className="text-red-500">*</span>
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
            >
              <option value="UPCOMING">即将开始</option>
              <option value="ONGOING">进行中</option>
              <option value="COMPLETED">已结束</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              会议描述
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="输入会议描述和主题..."
            />
          </div>

          {/* Website */}
          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700">
              会议官网
            </label>
            <input
              type="url"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                errors.website ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://conference.example.com"
            />
            {errors.website && (
              <p className="mt-1 text-sm text-red-600">{errors.website}</p>
            )}
          </div>

          {/* Venue */}
          <div>
            <label htmlFor="venueId" className="block text-sm font-medium text-gray-700">
              会议地点
            </label>
            {loadingVenues ? (
              <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-sm text-gray-500">
                加载地点列表中...
              </div>
            ) : (
              <select
                id="venueId"
                name="venueId"
                value={formData.venueId}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              >
                <option value="">请选择地点</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name} - {venue.city}, {venue.country}
                  </option>
                ))}
              </select>
            )}
            {venues.length === 0 && !loadingVenues && (
              <p className="mt-1 text-sm text-gray-500">
                暂无地点，请先
                <Link href="/admin/venues/new" className="text-green-600 hover:text-green-500 ml-1">
                  创建地点
                </Link>
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <label htmlFor="submissionDeadline" className="block text-sm font-medium text-gray-700">
                投稿截止日期
              </label>
              <input
                type="datetime-local"
                id="submissionDeadline"
                name="submissionDeadline"
                value={formData.submissionDeadline}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                  errors.submissionDeadline ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.submissionDeadline && (
                <p className="mt-1 text-sm text-red-600">{errors.submissionDeadline}</p>
              )}
            </div>

            <div>
              <label htmlFor="notificationDate" className="block text-sm font-medium text-gray-700">
                通知日期
              </label>
              <input
                type="datetime-local"
                id="notificationDate"
                name="notificationDate"
                value={formData.notificationDate}
                onChange={handleInputChange}
                className={`mt-1 block w-full border rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm ${
                  errors.notificationDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.notificationDate && (
                <p className="mt-1 text-sm text-red-600">{errors.notificationDate}</p>
              )}
            </div>

            <div>
              <label htmlFor="conferenceDate" className="block text-sm font-medium text-gray-700">
                会议日期
              </label>
              <input
                type="datetime-local"
                id="conferenceDate"
                name="conferenceDate"
                value={formData.conferenceDate}
                onChange={handleInputChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              />
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
              href="/admin/conferences"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                '创建会议'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
