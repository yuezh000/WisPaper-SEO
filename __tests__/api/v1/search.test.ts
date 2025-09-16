import { NextRequest } from 'next/server'
import { GET } from '@/app/api/v1/search/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    paper: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    author: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    conference: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    journal: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    institution: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/v1/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/search', () => {
    it('should perform global search across all entities', async () => {
      const mockResults = {
        papers: [testUtils.createMockPaper({ id: '1', title: 'Test Paper' })],
        authors: [testUtils.createMockAuthor({ id: '1', name: 'Test Author' })],
        conferences: [testUtils.createMockConference({ id: '1', name: 'Test Conference' })],
        journals: [testUtils.createMockJournal({ id: '1', name: 'Test Journal' })],
        institutions: [testUtils.createMockInstitution({ id: '1', name: 'Test University' })],
      }

      // Mock all entity searches
      mockPrisma.paper.findMany.mockResolvedValue(mockResults.papers)
      mockPrisma.paper.count.mockResolvedValue(1)
      mockPrisma.author.findMany.mockResolvedValue(mockResults.authors)
      mockPrisma.author.count.mockResolvedValue(1)
      mockPrisma.conference.findMany.mockResolvedValue(mockResults.conferences)
      mockPrisma.conference.count.mockResolvedValue(1)
      mockPrisma.journal.findMany.mockResolvedValue(mockResults.journals)
      mockPrisma.journal.count.mockResolvedValue(1)
      mockPrisma.institution.findMany.mockResolvedValue(mockResults.institutions)
      mockPrisma.institution.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=test&page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        papers: {
          data: mockResults.papers,
          total: 1,
        },
        authors: {
          data: mockResults.authors,
          total: 1,
        },
        conferences: {
          data: mockResults.conferences,
          total: 1,
        },
        journals: {
          data: mockResults.journals,
          total: 1,
        },
        institutions: {
          data: mockResults.institutions,
          total: 1,
        },
      })
    })

    it('should validate required query parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/search')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('query')
    })

    it('should validate query parameter length', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/search?q=a')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('query')
    })

    it('should search papers by title and abstract', async () => {
      const mockPapers = [testUtils.createMockPaper({ id: '1', title: 'Machine Learning Paper' })]
      mockPrisma.paper.findMany.mockResolvedValue(mockPapers)
      mockPrisma.paper.count.mockResolvedValue(1)

      // Mock other entities to return empty results
      mockPrisma.author.findMany.mockResolvedValue([])
      mockPrisma.author.count.mockResolvedValue(0)
      mockPrisma.conference.findMany.mockResolvedValue([])
      mockPrisma.conference.count.mockResolvedValue(0)
      mockPrisma.journal.findMany.mockResolvedValue([])
      mockPrisma.journal.count.mockResolvedValue(0)
      mockPrisma.institution.findMany.mockResolvedValue([])
      mockPrisma.institution.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=machine learning')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.papers.data).toHaveLength(1)
      expect(mockPrisma.paper.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ title: { contains: 'machine learning', mode: 'insensitive' } }),
              expect.objectContaining({ abstract: { contains: 'machine learning', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should search authors by name', async () => {
      const mockAuthors = [testUtils.createMockAuthor({ id: '1', name: 'John Doe' })]
      mockPrisma.author.findMany.mockResolvedValue(mockAuthors)
      mockPrisma.author.count.mockResolvedValue(1)

      // Mock other entities to return empty results
      mockPrisma.paper.findMany.mockResolvedValue([])
      mockPrisma.paper.count.mockResolvedValue(0)
      mockPrisma.conference.findMany.mockResolvedValue([])
      mockPrisma.conference.count.mockResolvedValue(0)
      mockPrisma.journal.findMany.mockResolvedValue([])
      mockPrisma.journal.count.mockResolvedValue(0)
      mockPrisma.institution.findMany.mockResolvedValue([])
      mockPrisma.institution.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=john doe')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.authors.data).toHaveLength(1)
      expect(mockPrisma.author.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'john doe', mode: 'insensitive' },
          }),
        })
      )
    })

    it('should search conferences by name and description', async () => {
      const mockConferences = [testUtils.createMockConference({ id: '1', name: 'AI Conference' })]
      mockPrisma.conference.findMany.mockResolvedValue(mockConferences)
      mockPrisma.conference.count.mockResolvedValue(1)

      // Mock other entities to return empty results
      mockPrisma.paper.findMany.mockResolvedValue([])
      mockPrisma.paper.count.mockResolvedValue(0)
      mockPrisma.author.findMany.mockResolvedValue([])
      mockPrisma.author.count.mockResolvedValue(0)
      mockPrisma.journal.findMany.mockResolvedValue([])
      mockPrisma.journal.count.mockResolvedValue(0)
      mockPrisma.institution.findMany.mockResolvedValue([])
      mockPrisma.institution.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=AI conference')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.conferences.data).toHaveLength(1)
      expect(mockPrisma.conference.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'AI conference', mode: 'insensitive' } }),
              expect.objectContaining({ description: { contains: 'AI conference', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should search journals by name and description', async () => {
      const mockJournals = [testUtils.createMockJournal({ id: '1', name: 'Nature Journal' })]
      mockPrisma.journal.findMany.mockResolvedValue(mockJournals)
      mockPrisma.journal.count.mockResolvedValue(1)

      // Mock other entities to return empty results
      mockPrisma.paper.findMany.mockResolvedValue([])
      mockPrisma.paper.count.mockResolvedValue(0)
      mockPrisma.author.findMany.mockResolvedValue([])
      mockPrisma.author.count.mockResolvedValue(0)
      mockPrisma.conference.findMany.mockResolvedValue([])
      mockPrisma.conference.count.mockResolvedValue(0)
      mockPrisma.institution.findMany.mockResolvedValue([])
      mockPrisma.institution.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=nature')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.journals.data).toHaveLength(1)
      expect(mockPrisma.journal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'nature', mode: 'insensitive' } }),
              expect.objectContaining({ description: { contains: 'nature', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should search institutions by name', async () => {
      const mockInstitutions = [testUtils.createMockInstitution({ id: '1', name: 'MIT' })]
      mockPrisma.institution.findMany.mockResolvedValue(mockInstitutions)
      mockPrisma.institution.count.mockResolvedValue(1)

      // Mock other entities to return empty results
      mockPrisma.paper.findMany.mockResolvedValue([])
      mockPrisma.paper.count.mockResolvedValue(0)
      mockPrisma.author.findMany.mockResolvedValue([])
      mockPrisma.author.count.mockResolvedValue(0)
      mockPrisma.conference.findMany.mockResolvedValue([])
      mockPrisma.conference.count.mockResolvedValue(0)
      mockPrisma.journal.findMany.mockResolvedValue([])
      mockPrisma.journal.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=MIT')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.institutions.data).toHaveLength(1)
      expect(mockPrisma.institution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: { contains: 'MIT', mode: 'insensitive' },
          }),
        })
      )
    })

    it('should handle pagination parameters', async () => {
      const mockResults = {
        papers: [],
        authors: [],
        conferences: [],
        journals: [],
        institutions: [],
      }

      // Mock all entity searches to return empty results
      mockPrisma.paper.findMany.mockResolvedValue(mockResults.papers)
      mockPrisma.paper.count.mockResolvedValue(0)
      mockPrisma.author.findMany.mockResolvedValue(mockResults.authors)
      mockPrisma.author.count.mockResolvedValue(0)
      mockPrisma.conference.findMany.mockResolvedValue(mockResults.conferences)
      mockPrisma.conference.count.mockResolvedValue(0)
      mockPrisma.journal.findMany.mockResolvedValue(mockResults.journals)
      mockPrisma.journal.count.mockResolvedValue(0)
      mockPrisma.institution.findMany.mockResolvedValue(mockResults.institutions)
      mockPrisma.institution.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=test&page=2&limit=5')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Check that pagination parameters are passed correctly
      expect(mockPrisma.paper.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5 = 5
          take: 5,
        })
      )
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.paper.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=test')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })

    it('should return empty results when no matches found', async () => {
      // Mock all entity searches to return empty results
      mockPrisma.paper.findMany.mockResolvedValue([])
      mockPrisma.paper.count.mockResolvedValue(0)
      mockPrisma.author.findMany.mockResolvedValue([])
      mockPrisma.author.count.mockResolvedValue(0)
      mockPrisma.conference.findMany.mockResolvedValue([])
      mockPrisma.conference.count.mockResolvedValue(0)
      mockPrisma.journal.findMany.mockResolvedValue([])
      mockPrisma.journal.count.mockResolvedValue(0)
      mockPrisma.institution.findMany.mockResolvedValue([])
      mockPrisma.institution.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=nonexistent')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.papers.data).toHaveLength(0)
      expect(data.data.authors.data).toHaveLength(0)
      expect(data.data.conferences.data).toHaveLength(0)
      expect(data.data.journals.data).toHaveLength(0)
      expect(data.data.institutions.data).toHaveLength(0)
    })

    it('should include related data in search results', async () => {
      const mockPapers = [
        testUtils.createMockPaper({
          id: '1',
          title: 'Test Paper',
          authors: [
            {
              author: {
                name: 'Test Author',
                institution: { name: 'Test University' },
              },
            },
          ],
          conference: { name: 'Test Conference' },
        }),
      ]

      mockPrisma.paper.findMany.mockResolvedValue(mockPapers)
      mockPrisma.paper.count.mockResolvedValue(1)

      // Mock other entities to return empty results
      mockPrisma.author.findMany.mockResolvedValue([])
      mockPrisma.author.count.mockResolvedValue(0)
      mockPrisma.conference.findMany.mockResolvedValue([])
      mockPrisma.conference.count.mockResolvedValue(0)
      mockPrisma.journal.findMany.mockResolvedValue([])
      mockPrisma.journal.count.mockResolvedValue(0)
      mockPrisma.institution.findMany.mockResolvedValue([])
      mockPrisma.institution.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/v1/search?q=test')
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
          },
        })
      )
    })
  })
})
