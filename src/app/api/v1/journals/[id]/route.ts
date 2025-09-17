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

    // Transform data
    const transformedJournal = {
      id: journal.id,
      name: journal.name,
      acronym: journal.acronym,
      issn: journal.issn,
      eissn: journal.eissn,
      description: journal.description,
      website: journal.website,
      publisher: journal.publisher,
      impact_factor: journal.impactFactor,
      status: journal.status,
      paper_count: journal._count.papers,
      recent_papers: journal.papers.map(paper => ({
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        doi: paper.doi,
        arxiv_id: paper.arxivId,
        publication_date: paper.publicationDate,
        authors: paper.authors.map(pa => ({
          id: pa.author.id,
          name: pa.author.name,
          institution: pa.author.institution
        })),
        keywords: paper.keywords.map(pk => pk.keyword.name),
        citation_count: paper.citationCount,
        seo_score: paper.seoScore
      })),
      created_at: journal.createdAt,
      updated_at: journal.updatedAt
    }

    return createApiResponse(transformedJournal, 'Journal retrieved successfully')
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

    // Transform data
    const transformedJournal = {
      id: updatedJournal.id,
      name: updatedJournal.name,
      acronym: updatedJournal.acronym,
      issn: updatedJournal.issn,
      eissn: updatedJournal.eissn,
      description: updatedJournal.description,
      website: updatedJournal.website,
      publisher: updatedJournal.publisher,
      impact_factor: updatedJournal.impactFactor,
      status: updatedJournal.status,
      created_at: updatedJournal.createdAt,
      updated_at: updatedJournal.updatedAt
    }

    return createApiResponse(transformedJournal, 'Journal updated successfully')
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
