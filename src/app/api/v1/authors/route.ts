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

    // Transform data
    const transformedAuthors = authors.map(author => ({
      id: author.id,
      name: author.name,
      email: author.email,
      orcid: author.orcid,
      institution: author.institution,
      bio: author.bio,
      homepage: author.homepage,
      paper_count: author._count.papers,
      created_at: author.createdAt,
      updated_at: author.updatedAt
    }))

    return createApiResponse(
      transformedAuthors,
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
      return createErrorResponse('Name and institution_id are required')
    }

    // Check if institution exists
    const institution = await prisma.institution.findUnique({
      where: { id: body.institution_id }
    })

    if (!institution) {
      return createErrorResponse('Institution not found', 404)
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

    // Transform data
    const transformedAuthor = {
      id: author.id,
      name: author.name,
      email: author.email,
      orcid: author.orcid,
      institution: author.institution,
      bio: author.bio,
      homepage: author.homepage,
      created_at: author.createdAt,
      updated_at: author.updatedAt
    }

    return createApiResponse(transformedAuthor, 'Author created successfully', undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
