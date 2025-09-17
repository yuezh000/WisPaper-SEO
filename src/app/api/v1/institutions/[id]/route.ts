import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, handleApiError } from '@/utils/api'

// GET /api/v1/institutions/[id] - Get institution by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid institution ID format', 400)
    }

    const institution = await prisma.institution.findUnique({
      where: { id }
    })

    if (!institution) {
      return createErrorResponse('Institution not found', 404)
    }

    return createApiResponse(institution, 'Institution retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/v1/institutions/[id] - Update institution
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid institution ID format', 400)
    }

    // Check if institution exists
    const existingInstitution = await prisma.institution.findUnique({
      where: { id }
    })

    if (!existingInstitution) {
      return createErrorResponse('Institution not found', 404)
    }

    // Only validate the 'name' field is present
    // 只校验 name 字段是否存在
    if (!body.name) {
      return createErrorResponse('name is required', 400)
    }

    const institution = await prisma.institution.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        description: body.description,
        website: body.website,
        country: body.country,
        city: body.city
      }
    })

    return createApiResponse(institution, 'Institution updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/v1/institutions/[id] - Delete institution
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid institution ID format', 400)
    }

    // Check if institution exists
    const existingInstitution = await prisma.institution.findUnique({
      where: { id }
    })

    if (!existingInstitution) {
      return createErrorResponse('Institution not found', 404)
    }

    await prisma.institution.delete({
      where: { id }
    })

    return createApiResponse(null, 'Institution deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
