import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/journals/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/v1/journals/[id]/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    journal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/v1/journals', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/journals', () => {
    it('should return list of journals with pagination', async () => {
      const mockJournals = [
        testUtils.createMockJournal({ id: '1', name: 'Journal A' }),
        testUtils.createMockJournal({ id: '2', name: 'Journal B' }),
      ]

      mockPrisma.journal.findMany.mockResolvedValue(mockJournals)
      mockPrisma.journal.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/v1/journals?page=1&limit=10')
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

    it('should filter journals by search term', async () => {
      const mockJournals = [
        testUtils.createMockJournal({ id: '1', name: 'Nature Journal' }),
      ]

      mockPrisma.journal.findMany.mockResolvedValue(mockJournals)
      mockPrisma.journal.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/journals?search=Nature')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(mockPrisma.journal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Nature', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should filter journals by status', async () => {
      const mockJournals = [
        testUtils.createMockJournal({ id: '1', status: 'ACTIVE' }),
      ]

      mockPrisma.journal.findMany.mockResolvedValue(mockJournals)
      mockPrisma.journal.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/journals?status=ACTIVE')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.journal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      )
    })

    it('should filter journals by publisher', async () => {
      const mockJournals = [
        testUtils.createMockJournal({ id: '1', publisher: 'Springer' }),
      ]

      mockPrisma.journal.findMany.mockResolvedValue(mockJournals)
      mockPrisma.journal.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/journals?publisher=Springer')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.journal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            publisher: { contains: 'Springer', mode: 'insensitive' },
          }),
        })
      )
    })

    it('should include paper count', async () => {
      const mockJournals = [
        testUtils.createMockJournal({
          id: '1',
          _count: { papers: 5 },
        }),
      ]

      mockPrisma.journal.findMany.mockResolvedValue(mockJournals)
      mockPrisma.journal.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/journals')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.journal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: {
              select: { papers: true },
            },
          },
        })
      )
    })

    it('should handle database errors', async () => {
      mockPrisma.journal.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/journals')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('POST /api/v1/journals', () => {
    it('should create a new journal', async () => {
      const newJournal = {
        name: 'New Journal',
        acronym: 'NJ',
        issn: '1234-5678',
        eissn: '8765-4321',
        description: 'New journal description',
        website: 'https://new-journal.com',
        publisher: 'New Publisher',
        impactFactor: 3.5,
        status: 'ACTIVE',
      }

      const createdJournal = testUtils.createMockJournal({
        id: 'new-journal-id',
        ...newJournal,
      })

      mockPrisma.journal.create.mockResolvedValue(createdJournal)

      const request = new NextRequest('http://localhost:3000/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify(newJournal),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdJournal)
      expect(mockPrisma.journal.create).toHaveBeenCalledWith({
        data: newJournal,
      })
    })

    it('should validate required fields', async () => {
      const invalidJournal = {
        name: '', // Empty name
        status: 'ACTIVE',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify(invalidJournal),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should validate ISSN format', async () => {
      const newJournal = {
        name: 'New Journal',
        issn: 'invalid-issn', // Invalid format
        status: 'ACTIVE',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify(newJournal),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('ISSN')
    })

    it('should validate e-ISSN format', async () => {
      const newJournal = {
        name: 'New Journal',
        eissn: 'invalid-eissn', // Invalid format
        status: 'ACTIVE',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify(newJournal),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('e-ISSN')
    })

    it('should validate impact factor', async () => {
      const newJournal = {
        name: 'New Journal',
        impactFactor: -1, // Invalid value
        status: 'ACTIVE',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify(newJournal),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('impact factor')
    })

    it('should validate website URL format', async () => {
      const newJournal = {
        name: 'New Journal',
        website: 'invalid-url', // Invalid URL
        status: 'ACTIVE',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify(newJournal),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('website')
    })

    it('should handle creation errors', async () => {
      const newJournal = {
        name: 'New Journal',
        status: 'ACTIVE',
      }

      mockPrisma.journal.create.mockRejectedValue(new Error('Creation failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify(newJournal),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Creation failed')
    })

    it('should handle duplicate ISSN', async () => {
      const newJournal = {
        name: 'New Journal',
        issn: '1234-5678',
        status: 'ACTIVE',
      }

      mockPrisma.journal.create.mockRejectedValue(
        new Error('Unique constraint failed on the constraint: `journals_issn_key`')
      )

      const request = new NextRequest('http://localhost:3000/api/v1/journals', {
        method: 'POST',
        body: JSON.stringify(newJournal),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('ISSN')
    })
  })
})

describe('/api/v1/journals/[id]', () => {
  const journalId = 'test-journal-id'

  describe('GET /api/v1/journals/[id]', () => {
    it('should return journal by id', async () => {
      const mockJournal = testUtils.createMockJournal({ id: journalId })

      mockPrisma.journal.findUnique.mockResolvedValue(mockJournal)

      const request = new NextRequest(`http://localhost:3000/api/v1/journals/${journalId}`)
      const response = await GET_BY_ID(request, { params: { id: journalId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockJournal)
      expect(mockPrisma.journal.findUnique).toHaveBeenCalledWith({
        where: { id: journalId },
        include: {
          papers: true,
        },
      })
    })

    it('should return 404 for non-existent journal', async () => {
      mockPrisma.journal.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/v1/journals/${journalId}`)
      const response = await GET_BY_ID(request, { params: { id: journalId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Journal not found')
    })

    it('should handle database errors', async () => {
      mockPrisma.journal.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/v1/journals/${journalId}`)
      const response = await GET_BY_ID(request, { params: { id: journalId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('PUT /api/v1/journals/[id]', () => {
    it('should update journal', async () => {
      const updateData = {
        name: 'Updated Journal',
        impactFactor: 4.0,
      }

      const updatedJournal = testUtils.createMockJournal({
        id: journalId,
        ...updateData,
      })

      mockPrisma.journal.update.mockResolvedValue(updatedJournal)

      const request = new NextRequest(`http://localhost:3000/api/v1/journals/${journalId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: { id: journalId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedJournal)
      expect(mockPrisma.journal.update).toHaveBeenCalledWith({
        where: { id: journalId },
        data: updateData,
      })
    })

    it('should handle update errors', async () => {
      const updateData = { name: 'Updated Journal' }

      mockPrisma.journal.update.mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest(`http://localhost:3000/api/v1/journals/${journalId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: { id: journalId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Update failed')
    })
  })

  describe('DELETE /api/v1/journals/[id]', () => {
    it('should delete journal', async () => {
      mockPrisma.journal.delete.mockResolvedValue(testUtils.createMockJournal({ id: journalId }))

      const request = new NextRequest(`http://localhost:3000/api/v1/journals/${journalId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: journalId } })
      const data = await response.json()

      expect(response.status).toBe(204)
      expect(data.success).toBe(true)
      expect(mockPrisma.journal.delete).toHaveBeenCalledWith({
        where: { id: journalId },
      })
    })

    it('should handle deletion errors', async () => {
      mockPrisma.journal.delete.mockRejectedValue(new Error('Deletion failed'))

      const request = new NextRequest(`http://localhost:3000/api/v1/journals/${journalId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: journalId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Deletion failed')
    })
  })
})
