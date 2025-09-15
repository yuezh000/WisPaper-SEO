import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, parseQueryParams, handleApiError } from '@/utils/api'

// GET /api/v1/institutions - Get institutions list
export async function GET(request: NextRequest) {
  try {
    const { page, limit, search, sort, order } = parseQueryParams(request)
    const { searchParams } = new URL(request.url)
    
    const type = searchParams.get('type') || undefined
    const country = searchParams.get('country') || undefined

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (type) {
      where.type = type
    }
    
    if (country) {
      where.country = country
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sort) {
      orderBy[sort] = order
    } else {
      orderBy.name = 'asc'
    }

    // Get total count
    const total = await prisma.institution.count({ where })

    // Get institutions with pagination
    const institutions = await prisma.institution.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            authors: true
          }
        }
      }
    })

    // Transform data
    const transformedInstitutions = institutions.map(institution => ({
      id: institution.id,
      name: institution.name,
      type: institution.type,
      country: institution.country,
      city: institution.city,
      website: institution.website,
      author_count: institution._count.authors,
      created_at: institution.createdAt,
      updated_at: institution.updatedAt
    }))

    return createApiResponse(
      transformedInstitutions,
      'Institutions retrieved successfully',
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

// POST /api/v1/institutions - Create new institution
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.type) {
      return createErrorResponse('Name and type are required')
    }

    // Create institution
    const institution = await prisma.institution.create({
      data: {
        name: body.name,
        type: body.type,
        country: body.country,
        city: body.city,
        website: body.website
      }
    })

    // Transform data
    const transformedInstitution = {
      id: institution.id,
      name: institution.name,
      type: institution.type,
      country: institution.country,
      city: institution.city,
      website: institution.website,
      created_at: institution.createdAt,
      updated_at: institution.updatedAt
    }

    return createApiResponse(transformedInstitution, 'Institution created successfully', undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
