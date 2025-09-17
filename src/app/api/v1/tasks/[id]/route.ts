import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, handleApiError } from '@/utils/api'

// GET /api/v1/tasks/[id] - Get task by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid task ID format', 400, 'Invalid task ID format')
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!task) {
      return createErrorResponse('Task not found', 404)
    }

    // Transform data
    const transformedTask = {
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      payload: task.payload,
      result: task.result,
      error: task.error,
      started_at: task.startedAt,
      completed_at: task.completedAt,
      created_at: task.createdAt,
      updated_at: task.updatedAt,
      logs: task.logs.map(log => ({
        id: log.id,
        level: log.level,
        message: log.message,
        data: log.data,
        created_at: log.createdAt
      }))
    }

    return createApiResponse(transformedTask, 'Task retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/v1/tasks/[id] - Update task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid task ID format', 400, 'Invalid task ID format')
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return createErrorResponse('Task not found', 404)
    }

    // Validate status enum if provided
    if (body.status) {
      const validStatuses = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']
      if (!validStatuses.includes(body.status)) {
        return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'status')
      }
    }

    // Validate task type enum if provided
    if (body.type) {
      const validTaskTypes = ['CRAWL', 'PARSE_PDF', 'GENERATE_ABSTRACT', 'INDEX_PAGE']
      if (!validTaskTypes.includes(body.type)) {
        return createErrorResponse(`Invalid task type. Must be one of: ${validTaskTypes.join(', ')}`, 400, 'type')
      }
    }

    // Validate priority range if provided
    if (body.priority !== undefined && (body.priority < 1 || body.priority > 10)) {
      return createErrorResponse('Priority must be between 1 and 10', 400, 'priority')
    }

    // Validate payload is object if provided
    if (body.payload !== undefined && (typeof body.payload !== 'object' || body.payload === null)) {
      return createErrorResponse('Payload must be a valid JSON object', 400, 'payload')
    }

    // Build update data object with only provided fields
    const updateData: any = {}
    if (body.type !== undefined) updateData.type = body.type
    if (body.status !== undefined) updateData.status = body.status
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.payload !== undefined) updateData.payload = body.payload
    if (body.result !== undefined) updateData.result = body.result
    if (body.error !== undefined) updateData.error = body.error
    if (body.started_at !== undefined) updateData.startedAt = new Date(body.started_at)
    if (body.completed_at !== undefined) updateData.completedAt = new Date(body.completed_at)

    const task = await prisma.task.update({
      where: { id },
      data: updateData
    })

    // Transform data
    const transformedTask = {
      id: task.id,
      type: task.type,
      status: task.status,
      priority: task.priority,
      payload: task.payload,
      result: task.result,
      error: task.error,
      started_at: task.startedAt,
      completed_at: task.completedAt,
      created_at: task.createdAt,
      updated_at: task.updatedAt
    }

    return createApiResponse(transformedTask, 'Task updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/v1/tasks/[id] - Delete task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid task ID format', 400, 'Invalid task ID format')
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id }
    })

    if (!existingTask) {
      return createErrorResponse('Task not found', 404)
    }

    await prisma.task.delete({
      where: { id }
    })

    return createApiResponse(null, 'Task deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
