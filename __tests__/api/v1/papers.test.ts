import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/papers/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/v1/papers/[id]/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    paper: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    author: {
      findMany: jest.fn(),
    },
    conference: {
      findUnique: jest.fn(),
    },
    journal: {
      findUnique: jest.fn(),
    },
    paperAuthor: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/v1/papers', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/papers', () => {
    it('should return list of papers with pagination', async () => {
      const mockPapers = [
        testUtils.createMockPaper({ id: '1', title: 'Paper A' }),
        testUtils.createMockPaper({ id: '2', title: 'Paper B' }),
      ]

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers)
      mockPrisma.paper.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/v1/papers?page=1&limit=10')
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

    it('should filter papers by search term', async () => {
      const mockPapers = [
        testUtils.createMockPaper({ id: '1', title: 'Machine Learning Paper' }),
      ]

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers)
      mockPrisma.paper.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/papers?search=Machine Learning')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(mockPrisma.paper.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'Machine Learning', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should filter papers by status', async () => {
      const mockPapers = [
        testUtils.createMockPaper({ id: '1', status: 'PUBLISHED' }),
      ]

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers)
      mockPrisma.paper.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/papers?status=PUBLISHED')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.paper.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
        })
      )
    })

    it('should include author and conference information', async () => {
      const mockPapers = [
        testUtils.createMockPaper({
          id: '1',
          authors: [
            {
              id: 'author-1',
              name: 'Author Name',
              institution: { name: 'Test University' },
            },
          ],
          conference: {
            name: 'Test Conference',
            acronym: 'TC',
          },
        }),
      ]

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers)
      mockPrisma.paper.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/papers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.paper.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            authors: {
              include: {
                author: {
                  include: {
                    institution: true,
                  },
                },
              },
            },
            conference: true,
            journal: true,
            keywords: {
              include: {
                keyword: true,
              },
            },
          },
        })
      )
    })

    it('should handle database errors', async () => {
      mockPrisma.paper.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/papers')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('POST /api/v1/papers', () => {
    it('should create a new paper', async () => {
      const newPaper = {
        title: 'New Paper',
        abstract: 'New paper abstract',
        doi: '10.1000/new',
        arxivId: '1234.5678',
        pdfUrl: 'https://new-paper.pdf',
        publicationDate: '2024-01-01T00:00:00Z',
        conferenceId: 'conference-1',
        journalId: 'journal-1',
        venue: 'New Venue',
        pages: '1-10',
        volume: '1',
        issue: '1',
        status: 'DRAFT',
        seoScore: 8.0,
        authors: ['author-1', 'author-2'],
      }

      const createdPaper = testUtils.createMockPaper({
        id: 'new-paper-id',
        ...newPaper,
      })

      mockPrisma.author.findMany.mockResolvedValue([
        { id: 'author-1', name: 'Author 1' },
        { id: 'author-2', name: 'Author 2' },
      ])
      mockPrisma.conference.findUnique.mockResolvedValue({
        id: 'conference-1',
        name: 'Test Conference',
      })
      mockPrisma.journal.findUnique.mockResolvedValue({
        id: 'journal-1',
        name: 'Test Journal',
      })
      mockPrisma.paper.create.mockResolvedValue(createdPaper)
      mockPrisma.paperAuthor.createMany.mockResolvedValue({ count: 2 })

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdPaper)
      expect(mockPrisma.paper.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: newPaper.title,
          abstract: newPaper.abstract,
          doi: newPaper.doi,
          arxivId: newPaper.arxivId,
          pdfUrl: newPaper.pdfUrl,
          publicationDate: new Date(newPaper.publicationDate),
          conferenceId: newPaper.conferenceId,
          journalId: newPaper.journalId,
          venue: newPaper.venue,
          pages: newPaper.pages,
          volume: newPaper.volume,
          issue: newPaper.issue,
          status: newPaper.status,
          seoScore: newPaper.seoScore,
        }),
      })
    })

    it('should validate required fields', async () => {
      const invalidPaper = {
        title: '', // Empty title
        status: 'DRAFT',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(invalidPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should validate authors exist', async () => {
      const newPaper = {
        title: 'New Paper',
        authors: ['non-existent-author'],
        status: 'DRAFT',
      }

      mockPrisma.author.findMany.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('authors')
    })

    it('should validate conference exists when provided', async () => {
      const newPaper = {
        title: 'New Paper',
        conferenceId: 'non-existent-conference',
        status: 'DRAFT',
      }

      mockPrisma.conference.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('conference')
    })

    it('should validate journal exists when provided', async () => {
      const newPaper = {
        title: 'New Paper',
        journalId: 'non-existent-journal',
        status: 'DRAFT',
      }

      mockPrisma.journal.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('journal')
    })

    it('should validate DOI format', async () => {
      const newPaper = {
        title: 'New Paper',
        doi: 'invalid-doi', // Invalid format
        status: 'DRAFT',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('DOI')
    })

    it('should validate arXiv ID format', async () => {
      const newPaper = {
        title: 'New Paper',
        arxivId: 'invalid-arxiv', // Invalid format
        status: 'DRAFT',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('arXiv')
    })

    it('should validate SEO score range', async () => {
      const newPaper = {
        title: 'New Paper',
        seoScore: 15, // Invalid range (should be 0-10)
        status: 'DRAFT',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('SEO score')
    })

    it('should handle creation errors', async () => {
      const newPaper = {
        title: 'New Paper',
        status: 'DRAFT',
      }

      mockPrisma.paper.create.mockRejectedValue(new Error('Creation failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Creation failed')
    })

    it('should handle duplicate DOI', async () => {
      const newPaper = {
        title: 'New Paper',
        doi: '10.1000/existing',
        status: 'DRAFT',
      }

      mockPrisma.paper.create.mockRejectedValue(
        new Error('Unique constraint failed on the constraint: `papers_doi_key`')
      )

      const request = new NextRequest('http://localhost:3000/api/v1/papers', {
        method: 'POST',
        body: JSON.stringify(newPaper),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('DOI')
    })
  })
})

describe('/api/v1/papers/[id]', () => {
  const paperId = 'test-paper-id'

  describe('GET /api/v1/papers/[id]', () => {
    it('should return paper by id', async () => {
      const mockPaper = testUtils.createMockPaper({ id: paperId })

      mockPrisma.paper.findUnique.mockResolvedValue(mockPaper)

      const request = new NextRequest(`http://localhost:3000/api/v1/papers/${paperId}`)
      const response = await GET_BY_ID(request, { params: { id: paperId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockPaper)
      expect(mockPrisma.paper.findUnique).toHaveBeenCalledWith({
        where: { id: paperId },
        include: {
          authors: {
            include: {
              author: {
                include: {
                  institution: true,
                },
              },
            },
          },
          conference: true,
          journal: true,
          keywords: {
            include: {
              keyword: true,
            },
          },
          abstracts: true,
        },
      })
    })

    it('should return 404 for non-existent paper', async () => {
      mockPrisma.paper.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/v1/papers/${paperId}`)
      const response = await GET_BY_ID(request, { params: { id: paperId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Paper not found')
    })

    it('should handle database errors', async () => {
      mockPrisma.paper.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/v1/papers/${paperId}`)
      const response = await GET_BY_ID(request, { params: { id: paperId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('PUT /api/v1/papers/[id]', () => {
    it('should update paper', async () => {
      const updateData = {
        title: 'Updated Paper',
        seoScore: 9.0,
      }

      const updatedPaper = testUtils.createMockPaper({
        id: paperId,
        ...updateData,
      })

      mockPrisma.paper.update.mockResolvedValue(updatedPaper)

      const request = new NextRequest(`http://localhost:3000/api/v1/papers/${paperId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: { id: paperId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedPaper)
      expect(mockPrisma.paper.update).toHaveBeenCalledWith({
        where: { id: paperId },
        data: updateData,
      })
    })

    it('should handle update errors', async () => {
      const updateData = { title: 'Updated Paper' }

      mockPrisma.paper.update.mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest(`http://localhost:3000/api/v1/papers/${paperId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: { id: paperId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Update failed')
    })
  })

  describe('DELETE /api/v1/papers/[id]', () => {
    it('should delete paper', async () => {
      mockPrisma.paper.delete.mockResolvedValue(testUtils.createMockPaper({ id: paperId }))

      const request = new NextRequest(`http://localhost:3000/api/v1/papers/${paperId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: paperId } })
      const data = await response.json()

      expect(response.status).toBe(204)
      expect(data.success).toBe(true)
      expect(mockPrisma.paper.delete).toHaveBeenCalledWith({
        where: { id: paperId },
      })
    })

    it('should handle deletion errors', async () => {
      mockPrisma.paper.delete.mockRejectedValue(new Error('Deletion failed'))

      const request = new NextRequest(`http://localhost:3000/api/v1/papers/${paperId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: paperId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Deletion failed')
    })
  })
})
