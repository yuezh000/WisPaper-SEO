import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, parseQueryParams, handleApiError } from '@/utils/api'
import { AuthorQueryParams, CreateAuthorRequest } from '@/types/api'

// GET /api/v1/authors - Get authors list
export async function GET(request: NextRequest) {
  try {
    const { page, limit, search, sort, order } = parseQueryParams(request)
    const { searchParams } = new URL(request.url)
    
    const institutionId = searchParams.get('institution_id') || undefined

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { orcid: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (institutionId) {
      where.institutionId = institutionId
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sort) {
      orderBy[sort] = order
    } else {
      orderBy.name = 'asc'
    }

    // Get total count
    const total = await prisma.author.count({ where })

    // Get authors with pagination
    const authors = await prisma.author.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        institution: true,
        _count: {
          select: {
            papers: true
          }
        }
      }
    })

    return createApiResponse(
      authors,
      'Authors retrieved successfully',
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

// POST /api/v1/authors - Create new author
export async function POST(request: NextRequest) {
  try {
    const body: CreateAuthorRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.institution_id) {
      const missingFields = []
      if (!body.name) missingFields.push('name')
      if (!body.institution_id) missingFields.push('institution_id')
      return createErrorResponse(`${missingFields.join(' and ')} are required`, 400, missingFields.join(' and '))
    }

    // Validate email format if provided
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return createErrorResponse('Invalid email format', 400, 'email')
      }
    }

    // Validate ORCID format if provided
    if (body.orcid) {
      const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/
      if (!orcidRegex.test(body.orcid)) {
        return createErrorResponse('Invalid ORCID format. Must be in format: 0000-0000-0000-0000', 400, 'orcid')
      }
    }


    // Create author
    const author = await prisma.author.create({
      data: {
        name: body.name,
        email: body.email,
        orcid: body.orcid,
        institutionId: body.institution_id,
        bio: body.bio,
        homepage: body.homepage
      },
      include: {
        institution: true
      }
    })

    return createApiResponse(author, 'Author created successfully', undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
