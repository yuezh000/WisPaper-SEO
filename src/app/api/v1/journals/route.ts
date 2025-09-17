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

    return createApiResponse(
      journals,
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
      const missingFields = []
      if (!body.name) missingFields.push('name')
      if (!body.status) missingFields.push('status')
      return createErrorResponse(`${missingFields.join(' and ')} are required`, 400, missingFields.join(' and '))
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

    return createApiResponse(journal, 'Journal created successfully', undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
