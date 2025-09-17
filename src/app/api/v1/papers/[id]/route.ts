import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, handleApiError, isValidUUID } from '@/utils/api'
import { UpdatePaperRequest } from '@/types/api'

// GET /api/v1/papers/[id] - Get paper by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid paper ID format', 400)
    }

    const paper = await prisma.paper.findUnique({
      where: { id },
      include: {
        authors: {
          include: {
            author: {
              include: {
                institution: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        conference: {
          include: {
            venue: true
          }
        },
        keywords: {
          include: {
            keyword: true
          }
        },
        abstracts: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!paper) {
      return createErrorResponse('Paper not found', 404)
    }

    return createApiResponse(paper, 'Paper retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/v1/papers/[id] - Update paper
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdatePaperRequest = await request.json()

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid paper ID format', 400)
    }

    // Check if paper exists
    const existingPaper = await prisma.paper.findUnique({
      where: { id }
    })

    if (!existingPaper) {
      return createErrorResponse('Paper not found', 404)
    }

    // Update paper
    const updatedPaper = await prisma.paper.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.abstract && { abstract: body.abstract }),
        ...(body.status && { status: body.status as any }),
        ...(body.seo_score !== undefined && { seoScore: body.seo_score })
      },
      include: {
        authors: {
          include: {
            author: {
              include: {
                institution: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        conference: true,
        keywords: {
          include: {
            keyword: true
          }
        }
      }
    })

    return createApiResponse(updatedPaper, 'Paper updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/v1/papers/[id] - Delete paper
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid paper ID format', 400)
    }

    // Check if paper exists
    const existingPaper = await prisma.paper.findUnique({
      where: { id }
    })

    if (!existingPaper) {
      return createErrorResponse('Paper not found', 404)
    }

    // Delete paper (cascade will handle related records)
    await prisma.paper.delete({
      where: { id }
    })

    return createApiResponse(null, 'Paper deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}
