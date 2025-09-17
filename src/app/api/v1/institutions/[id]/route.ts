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
      where: { id },
      include: {
        authors: {
          include: {
            papers: {
              include: {
                paper: true
              }
            }
          }
        }
      }
    })

    if (!institution) {
      return createErrorResponse('Institution not found', 404)
    }

    // Transform data
    const transformedInstitution = {
      id: institution.id,
      name: institution.name,
      type: institution.type,
      website: institution.website,
      country: institution.country,
      city: institution.city,
      created_at: institution.createdAt,
      updated_at: institution.updatedAt,
      authors: institution.authors.map(author => ({
        id: author.id,
        name: author.name,
        email: author.email,
        orcid: author.orcid,
        bio: author.bio,
        created_at: author.createdAt,
        updated_at: author.updatedAt
      }))
    }

    return createApiResponse(transformedInstitution, 'Institution retrieved successfully')
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

    // Validate required fields
    if (!body.name || !body.type) {
      const missingFields = []
      if (!body.name) missingFields.push('name')
      if (!body.type) missingFields.push('type')
      return createErrorResponse(`${missingFields.join(' and ')} are required`, 400, missingFields.join(' and '))
    }

    const institution = await prisma.institution.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        website: body.website,
        country: body.country,
        city: body.city
      }
    })

    // Transform data
    const transformedInstitution = {
      id: institution.id,
      name: institution.name,
      type: institution.type,
      website: institution.website,
      country: institution.country,
      city: institution.city,
      created_at: institution.createdAt,
      updated_at: institution.updatedAt
    }

    return createApiResponse(transformedInstitution, 'Institution updated successfully')
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
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
