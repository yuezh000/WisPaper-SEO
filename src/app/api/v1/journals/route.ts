import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, parseQueryParams, handleApiError } from '@/utils/api'

// GET /api/v1/journals - Get journals list
export async function GET(request: NextRequest) {
  try {
    const { page, limit, search, sort, order } = parseQueryParams(request)
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || undefined
    const publisher = searchParams.get('publisher') || undefined

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { acronym: { contains: search, mode: 'insensitive' } },
        { issn: { contains: search, mode: 'insensitive' } },
        { eissn: { contains: search, mode: 'insensitive' } },
        { publisher: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (publisher) {
      where.publisher = { contains: publisher, mode: 'insensitive' }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sort) {
      orderBy[sort] = order
    } else {
      orderBy.name = 'asc'
    }

    // Get total count
    const total = await prisma.journal.count({ where })

    // Get journals with pagination
    const journals = await prisma.journal.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            papers: true
          }
        }
      }
    })

    // Transform data
    const transformedJournals = journals.map(journal => ({
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
      created_at: journal.createdAt,
      updated_at: journal.updatedAt
    }))

    return createApiResponse(
      transformedJournals,
      'Journals retrieved successfully',
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

// POST /api/v1/journals - Create new journal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.status) {
      return createErrorResponse('Name and status are required')
    }

    // Create journal
    const journal = await prisma.journal.create({
      data: {
        name: body.name,
        acronym: body.acronym,
        issn: body.issn,
        eissn: body.eissn,
        description: body.description,
        website: body.website,
        publisher: body.publisher,
        impactFactor: body.impact_factor,
        status: body.status
      }
    })

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
      created_at: journal.createdAt,
      updated_at: journal.updatedAt
    }

    return createApiResponse(transformedJournal, 'Journal created successfully', undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
