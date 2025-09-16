import { NextRequest } from 'next/server'
import { GET } from '@/app/api/v1/stats/overview/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    paper: {
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    conference: {
      count: jest.fn(),
    },
    journal: {
      count: jest.fn(),
    },
    author: {
      count: jest.fn(),
    },
    task: {
      count: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('/api/v1/stats/overview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/stats/overview', () => {
    it('should return system overview statistics', async () => {
      // Mock all count operations
      mockPrisma.paper.count.mockResolvedValue(100)
      mockPrisma.conference.count.mockResolvedValue(25)
      mockPrisma.journal.count.mockResolvedValue(50)
      mockPrisma.author.count.mockResolvedValue(200)
      mockPrisma.task.count
        .mockResolvedValueOnce(10) // pending tasks
        .mockResolvedValueOnce(5)  // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: 7.5 },
        _count: { seoScore: 80 },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        total_papers: 100,
        total_conferences: 25,
        total_journals: 50,
        total_authors: 200,
        pending_tasks: 10,
        failed_tasks: 5,
        seo_score_avg: 7.5,
      })
    })

    it('should handle zero SEO score average when no papers have scores', async () => {
      // Mock all count operations
      mockPrisma.paper.count.mockResolvedValue(100)
      mockPrisma.conference.count.mockResolvedValue(25)
      mockPrisma.journal.count.mockResolvedValue(50)
      mockPrisma.author.count.mockResolvedValue(200)
      mockPrisma.task.count
        .mockResolvedValueOnce(10) // pending tasks
        .mockResolvedValueOnce(5)  // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: null },
        _count: { seoScore: 0 },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.seo_score_avg).toBe(0)
    })

    it('should handle empty database', async () => {
      // Mock all count operations to return 0
      mockPrisma.paper.count.mockResolvedValue(0)
      mockPrisma.conference.count.mockResolvedValue(0)
      mockPrisma.journal.count.mockResolvedValue(0)
      mockPrisma.author.count.mockResolvedValue(0)
      mockPrisma.task.count
        .mockResolvedValueOnce(0) // pending tasks
        .mockResolvedValueOnce(0) // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: null },
        _count: { seoScore: 0 },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        total_papers: 0,
        total_conferences: 0,
        total_journals: 0,
        total_authors: 0,
        pending_tasks: 0,
        failed_tasks: 0,
        seo_score_avg: 0,
      })
    })

    it('should call task count with correct status filters', async () => {
      // Mock all count operations
      mockPrisma.paper.count.mockResolvedValue(100)
      mockPrisma.conference.count.mockResolvedValue(25)
      mockPrisma.journal.count.mockResolvedValue(50)
      mockPrisma.author.count.mockResolvedValue(200)
      mockPrisma.task.count
        .mockResolvedValueOnce(10) // pending tasks
        .mockResolvedValueOnce(5)  // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: 7.5 },
        _count: { seoScore: 80 },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      await GET(request)

      // Verify task count calls with correct status filters
      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: { status: 'PENDING' },
      })
      expect(mockPrisma.task.count).toHaveBeenCalledWith({
        where: { status: 'FAILED' },
      })
    })

    it('should call paper aggregate with correct filter for SEO scores', async () => {
      // Mock all count operations
      mockPrisma.paper.count.mockResolvedValue(100)
      mockPrisma.conference.count.mockResolvedValue(25)
      mockPrisma.journal.count.mockResolvedValue(50)
      mockPrisma.author.count.mockResolvedValue(200)
      mockPrisma.task.count
        .mockResolvedValueOnce(10) // pending tasks
        .mockResolvedValueOnce(5)  // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: 7.5 },
        _count: { seoScore: 80 },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      await GET(request)

      // Verify paper aggregate call with correct filter
      expect(mockPrisma.paper.aggregate).toHaveBeenCalledWith({
        _avg: {
          seoScore: true,
        },
        where: {
          seoScore: {
            not: null,
          },
        },
      })
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.paper.count.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database connection failed')
    })

    it('should handle partial database errors', async () => {
      // Mock some operations to succeed and others to fail
      mockPrisma.paper.count.mockResolvedValue(100)
      mockPrisma.conference.count.mockRejectedValue(new Error('Conference table error'))
      mockPrisma.journal.count.mockResolvedValue(50)
      mockPrisma.author.count.mockResolvedValue(200)
      mockPrisma.task.count
        .mockResolvedValueOnce(10) // pending tasks
        .mockResolvedValueOnce(5)  // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: 7.5 },
        _count: { seoScore: 80 },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Conference table error')
    })

    it('should return correct data types', async () => {
      // Mock all count operations
      mockPrisma.paper.count.mockResolvedValue(100)
      mockPrisma.conference.count.mockResolvedValue(25)
      mockPrisma.journal.count.mockResolvedValue(50)
      mockPrisma.author.count.mockResolvedValue(200)
      mockPrisma.task.count
        .mockResolvedValueOnce(10) // pending tasks
        .mockResolvedValueOnce(5)  // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: 7.5 },
        _count: { seoScore: 80 },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify data types
      expect(typeof data.data.total_papers).toBe('number')
      expect(typeof data.data.total_conferences).toBe('number')
      expect(typeof data.data.total_journals).toBe('number')
      expect(typeof data.data.total_authors).toBe('number')
      expect(typeof data.data.pending_tasks).toBe('number')
      expect(typeof data.data.failed_tasks).toBe('number')
      expect(typeof data.data.seo_score_avg).toBe('number')
    })

    it('should handle high volume data', async () => {
      // Mock high volume counts
      mockPrisma.paper.count.mockResolvedValue(1000000)
      mockPrisma.conference.count.mockResolvedValue(50000)
      mockPrisma.journal.count.mockResolvedValue(100000)
      mockPrisma.author.count.mockResolvedValue(2000000)
      mockPrisma.task.count
        .mockResolvedValueOnce(1000) // pending tasks
        .mockResolvedValueOnce(100)  // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: 8.2 },
        _count: { seoScore: 800000 },
      })

      const request = new NextRequest('http://localhost:3000/api/v1/stats/overview')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual({
        total_papers: 1000000,
        total_conferences: 50000,
        total_journals: 100000,
        total_authors: 2000000,
        pending_tasks: 1000,
        failed_tasks: 100,
        seo_score_avg: 8.2,
      })
    })

    it('should handle concurrent requests', async () => {
      // Mock all count operations
      mockPrisma.paper.count.mockResolvedValue(100)
      mockPrisma.conference.count.mockResolvedValue(25)
      mockPrisma.journal.count.mockResolvedValue(50)
      mockPrisma.author.count.mockResolvedValue(200)
      mockPrisma.task.count
        .mockResolvedValueOnce(10) // pending tasks
        .mockResolvedValueOnce(5)  // failed tasks
      mockPrisma.paper.aggregate.mockResolvedValue({
        _avg: { seoScore: 7.5 },
        _count: { seoScore: 80 },
      })

      // Simulate concurrent requests
      const requests = Array(5).fill(null).map(() => 
        GET(new NextRequest('http://localhost:3000/api/v1/stats/overview'))
      )

      const responses = await Promise.all(requests)
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Verify all database calls were made
      expect(mockPrisma.paper.count).toHaveBeenCalledTimes(5)
      expect(mockPrisma.conference.count).toHaveBeenCalledTimes(5)
      expect(mockPrisma.journal.count).toHaveBeenCalledTimes(5)
      expect(mockPrisma.author.count).toHaveBeenCalledTimes(5)
      expect(mockPrisma.task.count).toHaveBeenCalledTimes(10) // 5 requests × 2 calls each
      expect(mockPrisma.paper.aggregate).toHaveBeenCalledTimes(5)
    })
  })
})
