import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/conferences/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    conference: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    venue: {
      findUnique: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/v1/conferences', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/conferences', () => {
    it('should return list of conferences with pagination', async () => {
      const mockConferences = [
        testUtils.createMockConference({ id: '1', name: 'Conference A' }),
        testUtils.createMockConference({ id: '2', name: 'Conference B' }),
      ]

      mockPrisma.conference.findMany.mockResolvedValue(mockConferences)
      mockPrisma.conference.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/v1/conferences?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      })
    })

    it('should filter conferences by search term', async () => {
      const mockConferences = [
        testUtils.createMockConference({ id: '1', name: 'AI Conference 2024' }),
      ]

      mockPrisma.conference.findMany.mockResolvedValue(mockConferences)
      mockPrisma.conference.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/conferences?search=AI')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(mockPrisma.conference.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'AI', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should filter conferences by status', async () => {
      const mockConferences = [
        testUtils.createMockConference({ id: '1', status: 'UPCOMING' }),
      ]

      mockPrisma.conference.findMany.mockResolvedValue(mockConferences)
      mockPrisma.conference.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/conferences?status=UPCOMING')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.conference.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'UPCOMING',
          }),
        })
      )
    })

    it('should include venue information', async () => {
      const mockConferences = [
        testUtils.createMockConference({
          id: '1',
          venue: {
            id: 'venue-1',
            name: 'Convention Center',
            city: 'Beijing',
            country: 'China',
          },
        }),
      ]

      mockPrisma.conference.findMany.mockResolvedValue(mockConferences)
      mockPrisma.conference.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/conferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.conference.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            venue: true,
            _count: {
              select: { papers: true },
            },
          },
        })
      )
    })

    it('should handle database errors', async () => {
      mockPrisma.conference.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/conferences')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('POST /api/v1/conferences', () => {
    it('should create a new conference', async () => {
      const newConference = {
        name: 'New Conference',
        acronym: 'NC',
        description: 'New conference description',
        website: 'https://new-conference.com',
        submissionDeadline: '2024-06-01T00:00:00Z',
        notificationDate: '2024-07-01T00:00:00Z',
        conferenceDate: '2024-08-01T00:00:00Z',
        venueId: 'venue-1',
        status: 'UPCOMING',
      }

      const createdConference = testUtils.createMockConference({
        id: 'new-conference-id',
        ...newConference,
      })

      mockPrisma.venue.findUnique.mockResolvedValue({
        id: 'venue-1',
        name: 'Test Venue',
        city: 'Beijing',
        country: 'China',
      })
      mockPrisma.conference.create.mockResolvedValue(createdConference)

      const request = new NextRequest('http://localhost:3000/api/v1/conferences', {
        method: 'POST',
        body: JSON.stringify(newConference),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdConference)
      expect(mockPrisma.conference.create).toHaveBeenCalledWith({
        data: {
          ...newConference,
          submissionDeadline: new Date(newConference.submissionDeadline),
          notificationDate: new Date(newConference.notificationDate),
          conferenceDate: new Date(newConference.conferenceDate),
        },
      })
    })

    it('should validate required fields', async () => {
      const invalidConference = {
        name: '', // Empty name
        status: 'UPCOMING',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/conferences', {
        method: 'POST',
        body: JSON.stringify(invalidConference),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should validate venue exists when provided', async () => {
      const newConference = {
        name: 'New Conference',
        venueId: 'non-existent-venue',
        status: 'UPCOMING',
      }

      mockPrisma.venue.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/conferences', {
        method: 'POST',
        body: JSON.stringify(newConference),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Venue not found')
    })

    it('should validate date logic', async () => {
      const newConference = {
        name: 'New Conference',
        submissionDeadline: '2024-08-01T00:00:00Z', // After conference date
        conferenceDate: '2024-07-01T00:00:00Z',
        status: 'UPCOMING',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/conferences', {
        method: 'POST',
        body: JSON.stringify(newConference),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('submission deadline')
    })

    it('should validate website URL format', async () => {
      const newConference = {
        name: 'New Conference',
        website: 'invalid-url', // Invalid URL
        status: 'UPCOMING',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/conferences', {
        method: 'POST',
        body: JSON.stringify(newConference),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('website')
    })

    it('should handle creation errors', async () => {
      const newConference = {
        name: 'New Conference',
        status: 'UPCOMING',
      }

      mockPrisma.conference.create.mockRejectedValue(new Error('Creation failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/conferences', {
        method: 'POST',
        body: JSON.stringify(newConference),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Creation failed')
    })

    it('should allow optional fields to be null', async () => {
      const newConference = {
        name: 'New Conference',
        status: 'UPCOMING',
        // Optional fields not provided
      }

      const createdConference = testUtils.createMockConference({
        id: 'new-conference-id',
        ...newConference,
        venueId: null,
        submissionDeadline: null,
        notificationDate: null,
        conferenceDate: null,
      })

      mockPrisma.conference.create.mockResolvedValue(createdConference)

      const request = new NextRequest('http://localhost:3000/api/v1/conferences', {
        method: 'POST',
        body: JSON.stringify(newConference),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(mockPrisma.conference.create).toHaveBeenCalledWith({
        data: newConference,
      })
    })
  })
})
