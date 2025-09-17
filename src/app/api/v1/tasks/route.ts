import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, parseQueryParams, handleApiError } from '@/utils/api'
import { TaskQueryParams, CreateTaskRequest } from '@/types/api'

// GET /api/v1/tasks - Get tasks list
export async function GET(request: NextRequest) {
  try {
    const { page, limit, search, sort, order } = parseQueryParams(request)
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const priority = searchParams.get('priority') ? parseInt(searchParams.get('priority')!) : undefined

    // Build where clause
    const where: any = {}
    
    if (type) {
      where.type = type
    }
    
    if (status) {
      where.status = status
    }
    
    if (priority !== undefined) {
      where.priority = priority
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sort) {
      orderBy[sort] = order
    } else {
      orderBy.createdAt = 'desc'
    }

    // Get total count
    const total = await prisma.task.count({ where })

    // Get tasks with pagination
    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            logs: true
          }
        }
      }
    })

    return createApiResponse(
      tasks,
      'Tasks retrieved successfully',
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/v1/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const body: CreateTaskRequest = await request.json()
    
    // Validate required fields
    if (!body.type || !body.payload) {
      const missingFields = []
      if (!body.type) missingFields.push('type')
      if (!body.payload) missingFields.push('payload')
      return createErrorResponse(`${missingFields.join(' and ')} are required`, 400, missingFields.join(' and '))
    }

    // Validate task type enum
    const validTaskTypes = ['CRAWL', 'PARSE_PDF', 'GENERATE_ABSTRACT', 'INDEX_PAGE']
    if (!validTaskTypes.includes(body.type)) {
      return createErrorResponse(`Invalid task type. Must be one of: ${validTaskTypes.join(', ')}`, 400, 'type')
    }

    // Validate priority range
    if (body.priority !== undefined && (body.priority < 1 || body.priority > 10)) {
      return createErrorResponse('Priority must be between 1 and 10', 400, 'priority')
    }

    // Validate payload is object
    if (typeof body.payload !== 'object' || body.payload === null) {
      return createErrorResponse('Payload must be a valid JSON object', 400, 'payload')
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        type: body.type as any,
        priority: body.priority || 5,
        payload: body.payload,
        scheduledAt: body.scheduled_at ? new Date(body.scheduled_at) : null,
        status: 'PENDING'
      }
    })

    return createApiResponse(task, 'Task created successfully', undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
