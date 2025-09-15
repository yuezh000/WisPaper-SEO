import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, parseQueryParams, handleApiError } from '@/utils/api'
import { ConferenceQueryParams, CreateConferenceRequest } from '@/types/api'

// GET /api/v1/conferences - Get conferences list
export async function GET(request: NextRequest) {
  try {
    const { page, limit, search, sort, order } = parseQueryParams(request)
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status') || undefined
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { acronym: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (status) {
      where.status = status
    }
    
    if (year) {
      where.conferenceDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`)
      }
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (sort) {
      orderBy[sort] = order
    } else {
      orderBy.conferenceDate = 'desc'
    }

    // Get total count
    const total = await prisma.conference.count({ where })

    // Get conferences with pagination
    const conferences = await prisma.conference.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        venue: true,
        _count: {
          select: {
            papers: true
          }
        }
      }
    })

    // Transform data
    const transformedConferences = conferences.map(conference => ({
      id: conference.id,
      name: conference.name,
      acronym: conference.acronym,
      description: conference.description,
      website: conference.website,
      submission_deadline: conference.submissionDeadline,
      notification_date: conference.notificationDate,
      conference_date: conference.conferenceDate,
      venue: conference.venue,
      status: conference.status,
      paper_count: conference._count.papers,
      created_at: conference.createdAt,
      updated_at: conference.updatedAt
    }))

    return createApiResponse(
      transformedConferences,
      'Conferences retrieved successfully',
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

// POST /api/v1/conferences - Create new conference
export async function POST(request: NextRequest) {
  try {
    const body: CreateConferenceRequest = await request.json()
    
    // Validate required fields
    if (!body.name || !body.status) {
      return createErrorResponse('Name and status are required')
    }

    // Create conference
    const conference = await prisma.conference.create({
      data: {
        name: body.name,
        acronym: body.acronym,
        description: body.description,
        website: body.website,
        submissionDeadline: body.submission_deadline ? new Date(body.submission_deadline) : null,
        notificationDate: body.notification_date ? new Date(body.notification_date) : null,
        conferenceDate: body.conference_date ? new Date(body.conference_date) : null,
        venueId: body.venue_id,
        status: body.status as any
      },
      include: {
        venue: true
      }
    })

    // Transform data
    const transformedConference = {
      id: conference.id,
      name: conference.name,
      acronym: conference.acronym,
      description: conference.description,
      website: conference.website,
      submission_deadline: conference.submissionDeadline,
      notification_date: conference.notificationDate,
      conference_date: conference.conferenceDate,
      venue: conference.venue,
      status: conference.status,
      created_at: conference.createdAt,
      updated_at: conference.updatedAt
    }

    return createApiResponse(transformedConference, 'Conference created successfully', undefined, 201)
  } catch (error) {
    return handleApiError(error)
  }
}
