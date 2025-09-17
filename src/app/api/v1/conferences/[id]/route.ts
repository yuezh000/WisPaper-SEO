import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, createErrorResponse, handleApiError } from '@/utils/api'

// GET /api/v1/conferences/[id] - Get conference by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid conference ID format', 400)
    }

    const conference = await prisma.conference.findUnique({
      where: { id },
      include: {
        venue: true,
        papers: {
          include: {
            authors: {
              include: {
                author: true
              }
            }
          }
        }
      }
    })

    if (!conference) {
      return createErrorResponse('Conference not found', 404)
    }

    // Transform data
    const transformedConference = {
      id: conference.id,
      name: conference.name,
      acronym: conference.acronym,
      description: conference.description,
      website: conference.website,
      status: conference.status,
      submission_deadline: conference.submissionDeadline,
      conference_date: conference.conferenceDate,
      venue: conference.venue,
      created_at: conference.createdAt,
      updated_at: conference.updatedAt,
      papers: conference.papers.map(paper => ({
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        doi: paper.doi,
        status: paper.status,
        seo_score: paper.seoScore,
        authors: paper.authors.map(pa => ({
          id: pa.author.id,
          name: pa.author.name,
          email: pa.author.email,
          orcid: pa.author.orcid,
          order: pa.order,
          is_corresponding: pa.isCorresponding
        }))
      }))
    }

    return createApiResponse(transformedConference, 'Conference retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/v1/conferences/[id] - Update conference
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid conference ID format', 400)
    }

    // Check if conference exists
    const existingConference = await prisma.conference.findUnique({
      where: { id }
    })

    if (!existingConference) {
      return createErrorResponse('Conference not found', 404)
    }

    // Validate status enum if provided
    if (body.status) {
      const validStatuses = ['UPCOMING', 'ONGOING', 'COMPLETED']
      if (!validStatuses.includes(body.status)) {
        return createErrorResponse(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, 'status')
      }
    }

    // Build update data object with only provided fields
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.acronym !== undefined) updateData.acronym = body.acronym
    if (body.description !== undefined) updateData.description = body.description
    if (body.website !== undefined) updateData.website = body.website
    if (body.status !== undefined) updateData.status = body.status
    if (body.submission_deadline !== undefined) updateData.submissionDeadline = new Date(body.submission_deadline)
    if (body.conference_date !== undefined) updateData.conferenceDate = new Date(body.conference_date)
    if (body.venue_id !== undefined) updateData.venueId = body.venue_id

    const conference = await prisma.conference.update({
      where: { id },
      data: updateData
    })

    // Transform data
    const transformedConference = {
      id: conference.id,
      name: conference.name,
      acronym: conference.acronym,
      description: conference.description,
      website: conference.website,
      status: conference.status,
      submission_deadline: conference.submissionDeadline,
      conference_date: conference.conferenceDate,
      created_at: conference.createdAt,
      updated_at: conference.updatedAt
    }

    return createApiResponse(transformedConference, 'Conference updated successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/v1/conferences/[id] - Delete conference
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return createErrorResponse('Invalid conference ID format', 400)
    }

    // Check if conference exists
    const existingConference = await prisma.conference.findUnique({
      where: { id }
    })

    if (!existingConference) {
      return createErrorResponse('Conference not found', 404)
    }

    await prisma.conference.delete({
      where: { id }
    })

    return createApiResponse(null, 'Conference deleted successfully')
  } catch (error) {
    return handleApiError(error)
  }
}

function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
