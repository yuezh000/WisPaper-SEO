import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, parseQueryParams, handleApiError } from '@/utils/api'
import { PaperQueryParams, CreatePaperRequest } from '@/types/api'

// GET /api/v1/papers - Get papers list
export async function GET(request: NextRequest) {
  try {
    const { page, limit, search, sort, order } = parseQueryParams(request)
    const { searchParams } = new URL(request.url)
    
    const conferenceId = searchParams.get('conference_id') || undefined
    const authorId = searchParams.get('author_id') || undefined
    const status = searchParams.get('status') || undefined
    const keyword = searchParams.get('keyword') || undefined

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { abstract: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (conferenceId) {
      where.conferenceId = conferenceId
    }
    
    if (status) {
      where.status = status
    }
    
    if (authorId) {
      where.authors = {
        some: {
          authorId: authorId
        }
      }
    }
    
    if (keyword) {
      where.keywords = {
        some: {
          keyword: {
            name: { contains: keyword, mode: 'insensitive' }
          }
        }
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sort) {
      orderBy[sort] = order
    } else {
      orderBy.createdAt = 'desc'
    }

    // Get total count
    const total = await prisma.paper.count({ where })

    // Get papers with pagination
    const papers = await prisma.paper.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
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
        },
        abstracts: {
          where: { source: 'ORIGINAL' },
          take: 1
        }
      }
    })

    // Transform data
    const transformedPapers = papers.map(paper => ({
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
      created_at: paper.createdAt,
      updated_at: paper.updatedAt
    }))

    return createApiResponse(
      transformedPapers,
      'Papers retrieved successfully',
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

// POST /api/v1/papers - Create new paper
export async function POST(request: NextRequest) {
  try {
    const body: CreatePaperRequest = await request.json()
    
    // Validate required fields
    if (!body.title || !body.author_ids || body.author_ids.length === 0) {
      const missingFields = []
      if (!body.title) missingFields.push('title')
      if (!body.author_ids || body.author_ids.length === 0) missingFields.push('author')
      return createErrorResponse(`${missingFields.join(' and ')} are required`, 400, missingFields.join(' and '))
    }

    // Create paper with transaction
    const paper = await prisma.$transaction(async (tx) => {
      // Create paper
      const newPaper = await tx.paper.create({
        data: {
          title: body.title,
          abstract: body.abstract,
          doi: body.doi,
          arxivId: body.arxiv_id,
          pdfUrl: body.pdf_url,
          publicationDate: body.publication_date ? new Date(body.publication_date) : null,
          conferenceId: body.conference_id,
          venue: body.venue,
          pages: body.pages,
          volume: body.volume,
          issue: body.issue,
          status: 'DRAFT'
        }
      })

      // Create author relationships
      if (body.author_ids.length > 0) {
        await tx.paperAuthor.createMany({
          data: body.author_ids.map((authorId, index) => ({
            paperId: newPaper.id,
            authorId,
            order: index + 1,
            isCorresponding: index === 0 // First author as corresponding
          }))
        })
      }

      // Create keyword relationships
      if (body.keywords && body.keywords.length > 0) {
        for (const keywordName of body.keywords) {
          // Find or create keyword
          let keyword = await tx.keyword.findUnique({
            where: { name: keywordName }
          })
          
          if (!keyword) {
            keyword = await tx.keyword.create({
              data: { name: keywordName }
            })
          }

          // Create relationship
          await tx.paperKeyword.create({
            data: {
              paperId: newPaper.id,
              keywordId: keyword.id
            }
          })
        }
      }

      return newPaper
    })

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
      created_at: paper.createdAt,
      updated_at: paper.updatedAt
    }

    return createApiResponse(transformedPaper, 'Paper created successfully', undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
