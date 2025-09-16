import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/authors/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    author: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    institution: {
      findUnique: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/v1/authors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/authors', () => {
    it('should return list of authors with pagination', async () => {
      const mockAuthors = [
        testUtils.createMockAuthor({ id: '1', name: 'Author A' }),
        testUtils.createMockAuthor({ id: '2', name: 'Author B' }),
      ]

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors)
      mockPrisma.author.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/v1/authors?page=1&limit=10')
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

    it('should filter authors by search term', async () => {
      const mockAuthors = [
        testUtils.createMockAuthor({ id: '1', name: 'John Doe' }),
      ]

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors)
      mockPrisma.author.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/authors?search=John')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(mockPrisma.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'John', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should filter authors by institution', async () => {
      const mockAuthors = [
        testUtils.createMockAuthor({ id: '1', institutionId: 'institution-1' }),
      ]

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors)
      mockPrisma.author.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/authors?institution_id=institution-1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            institutionId: 'institution-1',
          }),
        })
      )
    })

    it('should include institution information', async () => {
      const mockAuthors = [
        testUtils.createMockAuthor({
          id: '1',
          institution: {
            id: 'institution-1',
            name: 'Test University',
            type: 'UNIVERSITY',
          },
        }),
      ]

      mockPrisma.author.findMany.mockResolvedValue(mockAuthors)
      mockPrisma.author.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/authors')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            institution: true,
            _count: {
              select: { papers: true },
            },
          },
        })
      )
    })

    it('should handle database errors', async () => {
      mockPrisma.author.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/authors')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('POST /api/v1/authors', () => {
    it('should create a new author', async () => {
      const newAuthor = {
        name: 'New Author',
        email: 'new@example.com',
        orcid: '0000-0000-0000-0001',
        institutionId: 'institution-1',
        bio: 'New author bio',
        homepage: 'https://new-author.com',
      }

      const createdAuthor = testUtils.createMockAuthor({
        id: 'new-author-id',
        ...newAuthor,
      })

      mockPrisma.institution.findUnique.mockResolvedValue({
        id: 'institution-1',
        name: 'Test University',
        type: 'UNIVERSITY',
      })
      mockPrisma.author.create.mockResolvedValue(createdAuthor)

      const request = new NextRequest('http://localhost:3000/api/v1/authors', {
        method: 'POST',
        body: JSON.stringify(newAuthor),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdAuthor)
      expect(mockPrisma.author.create).toHaveBeenCalledWith({
        data: newAuthor,
      })
    })

    it('should validate required fields', async () => {
      const invalidAuthor = {
        name: '', // Empty name
        institutionId: 'institution-1',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/authors', {
        method: 'POST',
        body: JSON.stringify(invalidAuthor),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should validate institution exists', async () => {
      const newAuthor = {
        name: 'New Author',
        institutionId: 'non-existent-institution',
      }

      mockPrisma.institution.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/authors', {
        method: 'POST',
        body: JSON.stringify(newAuthor),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Institution not found')
    })

    it('should validate ORCID format', async () => {
      const newAuthor = {
        name: 'New Author',
        institutionId: 'institution-1',
        orcid: 'invalid-orcid', // Invalid format
      }

      mockPrisma.institution.findUnique.mockResolvedValue({
        id: 'institution-1',
        name: 'Test University',
        type: 'UNIVERSITY',
      })

      const request = new NextRequest('http://localhost:3000/api/v1/authors', {
        method: 'POST',
        body: JSON.stringify(newAuthor),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('ORCID')
    })

    it('should validate email format', async () => {
      const newAuthor = {
        name: 'New Author',
        institutionId: 'institution-1',
        email: 'invalid-email', // Invalid format
      }

      mockPrisma.institution.findUnique.mockResolvedValue({
        id: 'institution-1',
        name: 'Test University',
        type: 'UNIVERSITY',
      })

      const request = new NextRequest('http://localhost:3000/api/v1/authors', {
        method: 'POST',
        body: JSON.stringify(newAuthor),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('email')
    })

    it('should handle creation errors', async () => {
      const newAuthor = {
        name: 'New Author',
        institutionId: 'institution-1',
      }

      mockPrisma.institution.findUnique.mockResolvedValue({
        id: 'institution-1',
        name: 'Test University',
        type: 'UNIVERSITY',
      })
      mockPrisma.author.create.mockRejectedValue(new Error('Creation failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/authors', {
        method: 'POST',
        body: JSON.stringify(newAuthor),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Creation failed')
    })

    it('should handle duplicate ORCID', async () => {
      const newAuthor = {
        name: 'New Author',
        institutionId: 'institution-1',
        orcid: '0000-0000-0000-0000',
      }

      mockPrisma.institution.findUnique.mockResolvedValue({
        id: 'institution-1',
        name: 'Test University',
        type: 'UNIVERSITY',
      })
      mockPrisma.author.create.mockRejectedValue(
        new Error('Unique constraint failed on the constraint: `authors_orcid_key`')
      )

      const request = new NextRequest('http://localhost:3000/api/v1/authors', {
        method: 'POST',
        body: JSON.stringify(newAuthor),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('ORCID')
    })
  })
})
