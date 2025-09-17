import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, handleApiError } from '@/utils/api'

// GET /api/v1/authors/[id] - Get author by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid author ID format', 400)
    }

    const author = await prisma.author.findUnique({
      where: { id },
      include: {
        institution: true,
        papers: {
          include: {
            paper: {
              include: {
                conference: true
              }
            }
          }
        }
      }
    })

    if (!author) {
      return createErrorResponse('Author not found', 404)
    }

    return createApiResponse(author, 'Author retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/v1/authors/[id] - Update author
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid author ID format', 400)
    }

    // Check if author exists
    const existingAuthor = await prisma.author.findUnique({
      where: { id }
    })

    if (!existingAuthor) {
      return createErrorResponse('Author not found', 404)
    }


    // Build update data object with only provided fields
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.orcid !== undefined) updateData.orcid = body.orcid
    if (body.bio !== undefined) updateData.bio = body.bio
    if (body.institution_id !== undefined) updateData.institutionId = body.institution_id

    const author = await prisma.author.update({
      where: { id },
      data: updateData
    })

    return createApiResponse(author, 'Author updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/v1/authors/[id] - Delete author
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid author ID format', 400)
    }

    // Check if author exists
    const existingAuthor = await prisma.author.findUnique({
      where: { id }
    })

    if (!existingAuthor) {
      return createErrorResponse('Author not found', 404)
    }

    await prisma.author.delete({
      where: { id }
    })

    return createApiResponse(null, 'Author deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
