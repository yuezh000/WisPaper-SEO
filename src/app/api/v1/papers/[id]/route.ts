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

    // Transform data
    const transformedPaper = {
      id: paper.id,
      title: paper.title,
      abstract: paper.abstract,
      doi: paper.doi,
      arxiv_id: paper.arxivId,
      pdf_url: paper.pdfUrl,
      publication_date: paper.publicationDate,
      venue: paper.venue,
      pages: paper.pages,
      volume: paper.volume,
      issue: paper.issue,
      citation_count: paper.citationCount,
      status: paper.status,
      seo_score: paper.seoScore,
      authors: paper.authors.map(pa => ({
        id: pa.author.id,
        name: pa.author.name,
        email: pa.author.email,
        orcid: pa.author.orcid,
        institution: pa.author.institution,
        order: pa.order,
        is_corresponding: pa.isCorresponding
      })),
      conference: paper.conference,
      keywords: paper.keywords.map(pk => ({
        id: pk.keyword.id,
        name: pk.keyword.name,
        category: pk.keyword.category,
        relevance_score: pk.relevanceScore
      })),
      abstracts: paper.abstracts.map(abstract => ({
        id: abstract.id,
        content: abstract.content,
        language: abstract.language,
        source: abstract.source,
        quality_score: abstract.qualityScore,
        created_at: abstract.createdAt
      })),
      created_at: paper.createdAt,
      updated_at: paper.updatedAt
    }

    return createApiResponse(transformedPaper, 'Paper retrieved successfully')
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

    // Transform data
    const transformedPaper = {
      id: updatedPaper.id,
      title: updatedPaper.title,
      abstract: updatedPaper.abstract,
      doi: updatedPaper.doi,
      arxiv_id: updatedPaper.arxivId,
      pdf_url: updatedPaper.pdfUrl,
      publication_date: updatedPaper.publicationDate,
      venue: updatedPaper.venue,
      pages: updatedPaper.pages,
      volume: updatedPaper.volume,
      issue: updatedPaper.issue,
      citation_count: updatedPaper.citationCount,
      status: updatedPaper.status,
      seo_score: updatedPaper.seoScore,
      authors: updatedPaper.authors.map(pa => ({
        id: pa.author.id,
        name: pa.author.name,
        email: pa.author.email,
        orcid: pa.author.orcid,
        institution: pa.author.institution,
        order: pa.order,
        is_corresponding: pa.isCorresponding
      })),
      conference: updatedPaper.conference,
      keywords: updatedPaper.keywords.map(pk => ({
        id: pk.keyword.id,
        name: pk.keyword.name,
        category: pk.keyword.category,
        relevance_score: pk.relevanceScore
      })),
      created_at: updatedPaper.createdAt,
      updated_at: updatedPaper.updatedAt
    }

    return createApiResponse(transformedPaper, 'Paper updated successfully')
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
