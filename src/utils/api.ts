import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, PaginationInfo } from '@/types/api'

// Create standardized API response
export function createApiResponse<T>(
  data?: T,
  message?: string,
  pagination?: PaginationInfo,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: status >= 200 && status < 300,
    data,
    message,
    pagination
  }

  return NextResponse.json(response, { status })
}

// Create error response
export function createErrorResponse(
  message: string,
  status: number = 400,
  error?: string
): NextResponse<ApiResponse> {
  const response: ApiResponse = {
    success: false,
    message,
    error
  }

  return NextResponse.json(response, { status })
}

// Parse query parameters
export function parseQueryParams(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  return {
    page: parseInt(searchParams.get('page') || '1'),
    limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100),
    search: searchParams.get('search') || undefined,
    sort: searchParams.get('sort') || undefined,
    order: (searchParams.get('order') as 'asc' | 'desc') || 'desc'
  }
}

// Calculate pagination info
export function calculatePagination(
  page: number,
  limit: number,
  total: number
): PaginationInfo {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  }
}

// Validate UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Handle API errors
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error)
  
  if (error instanceof Error) {
    return createErrorResponse(error.message, 500, error.name)
  }
  
  return createErrorResponse('Internal server error', 500)
}

// Parse request body
export async function parseRequestBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}
