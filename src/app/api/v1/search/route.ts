import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, parseQueryParams, handleApiError } from '@/utils/api'
import { SearchQueryParams } from '@/types/api'

// GET /api/v1/search - Full-text search across papers, authors, and conferences
export async function GET(request: NextRequest) {
  try {
    const { page, limit } = parseQueryParams(request)
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'

    if (!query || query.trim().length === 0) {
      return createErrorResponse('Search query is required', 400)
    }

    // Validate pagination parameters
    if (page < 1) {
      return createErrorResponse('Page number must be greater than 0', 400, 'page')
    }

    if (limit < 1 || limit > 100) {
      return createErrorResponse('Limit must be between 1 and 100', 400, 'limit')
    }

    const searchTerm = query.trim()
    const results: any = {
      papers: [],
      authors: [],
      conferences: [],
      total: 0
    }

    // Search papers
    if (type === 'all' || type === 'papers') {
      const papers = await prisma.paper.findMany({
        where: {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { abstract: { contains: searchTerm, mode: 'insensitive' } },
            { doi: { contains: searchTerm, mode: 'insensitive' } },
            { arxivId: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
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
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      results.papers = papers.map(paper => ({
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
        conference: paper.conference,
        keywords: paper.keywords.map(pk => pk.keyword.name),
        created_at: paper.createdAt
      }))
    }

    // Search authors
    if (type === 'all' || type === 'authors') {
      const authors = await prisma.author.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { orcid: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: limit,
        include: {
          institution: true,
          _count: {
            select: {
              papers: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      results.authors = authors.map(author => ({
        id: author.id,
        name: author.name,
        email: author.email,
        orcid: author.orcid,
        institution: author.institution,
        paper_count: author._count.papers,
        created_at: author.createdAt
      }))
    }

    // Search conferences
    if (type === 'all' || type === 'conferences') {
      const conferences = await prisma.conference.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { acronym: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } }
          ]
        },
        take: limit,
        include: {
          venue: true,
          _count: {
            select: {
              papers: true
            }
          }
        },
        orderBy: { conferenceDate: 'desc' }
      })

      results.conferences = conferences.map(conference => ({
        id: conference.id,
        name: conference.name,
        acronym: conference.acronym,
        description: conference.description,
        website: conference.website,
        conference_date: conference.conferenceDate,
        venue: conference.venue,
        status: conference.status,
        paper_count: conference._count.papers,
        created_at: conference.createdAt
      }))
    }

    // Calculate total results
    results.total = results.papers.length + results.authors.length + results.conferences.length

    return createApiResponse(results, 'Search completed successfully')
  } catch (error) {
    return handleApiError(error)
  }
}
