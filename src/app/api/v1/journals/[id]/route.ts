import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, handleApiError, isValidUUID } from '@/utils/api'

// GET /api/v1/journals/[id] - Get journal by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid journal ID format', 400)
    }

    const journal = await prisma.journal.findUnique({
      where: { id },
      include: {
        papers: {
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
            keywords: {
              include: {
                keyword: true
              }
            }
          },
          orderBy: { publicationDate: 'desc' },
          take: 10
        },
        _count: {
          select: {
            papers: true
          }
        }
      }
    })

    if (!journal) {
      return createErrorResponse('Journal not found', 404)
    }

    return createApiResponse(journal, 'Journal retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/v1/journals/[id] - Update journal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid journal ID format', 400)
    }

    // Check if journal exists
    const existingJournal = await prisma.journal.findUnique({
      where: { id }
    })

    if (!existingJournal) {
      return createErrorResponse('Journal not found', 404)
    }

    // Update journal
    const updatedJournal = await prisma.journal.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.acronym && { acronym: body.acronym }),
        ...(body.issn && { issn: body.issn }),
        ...(body.eissn && { eissn: body.eissn }),
        ...(body.description && { description: body.description }),
        ...(body.website && { website: body.website }),
        ...(body.publisher && { publisher: body.publisher }),
        ...(body.impact_factor !== undefined && { impactFactor: body.impact_factor }),
        ...(body.status && { status: body.status })
      }
    })

    return createApiResponse(updatedJournal, 'Journal updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/v1/journals/[id] - Delete journal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid journal ID format', 400)
    }

    // Check if journal exists
    const existingJournal = await prisma.journal.findUnique({
      where: { id }
    })

    if (!existingJournal) {
      return createErrorResponse('Journal not found', 404)
    }

    // Delete journal (cascade will handle related records)
    await prisma.journal.delete({
      where: { id }
    })

    return createApiResponse(null, 'Journal deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}
