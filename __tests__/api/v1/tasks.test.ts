import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/tasks/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
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

describe('/api/v1/tasks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/tasks', () => {
    it('should return list of tasks with pagination', async () => {
      const mockTasks = [
        testUtils.createMockTask({ id: '1', type: 'CRAWL' }),
        testUtils.createMockTask({ id: '2', type: 'PARSE_PDF' }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)
      mockPrisma.task.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/v1/tasks?page=1&limit=10')
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

    it('should filter tasks by type', async () => {
      const mockTasks = [
        testUtils.createMockTask({ id: '1', type: 'CRAWL' }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)
      mockPrisma.task.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/tasks?type=CRAWL')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'CRAWL',
          }),
        })
      )
    })

    it('should filter tasks by status', async () => {
      const mockTasks = [
        testUtils.createMockTask({ id: '1', status: 'PENDING' }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)
      mockPrisma.task.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/tasks?status=PENDING')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
          }),
        })
      )
    })

    it('should filter tasks by priority', async () => {
      const mockTasks = [
        testUtils.createMockTask({ id: '1', priority: 1 }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)
      mockPrisma.task.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/tasks?priority=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            priority: 1,
          }),
        })
      )
    })

    it('should include logs information', async () => {
      const mockTasks = [
        testUtils.createMockTask({
          id: '1',
          logs: [
            {
              id: 'log-1',
              level: 'INFO',
              message: 'Task started',
              createdAt: new Date('2024-01-01'),
            },
          ],
        }),
      ]

      mockPrisma.task.findMany.mockResolvedValue(mockTasks)
      mockPrisma.task.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/tasks')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            logs: true,
          },
        })
      )
    })

    it('should handle database errors', async () => {
      mockPrisma.task.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/tasks')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const newTask = {
        type: 'CRAWL',
        priority: 5,
        payload: { url: 'https://example.com' },
        maxRetries: 3,
        scheduledAt: '2024-01-01T00:00:00Z',
      }

      const createdTask = testUtils.createMockTask({
        id: 'new-task-id',
        ...newTask,
      })

      mockPrisma.task.create.mockResolvedValue(createdTask)

      const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdTask)
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          ...newTask,
          status: 'PENDING',
          retryCount: 0,
          scheduledAt: new Date(newTask.scheduledAt),
        },
      })
    })

    it('should validate required fields', async () => {
      const invalidTask = {
        type: '', // Empty type
        priority: 5,
      }

      const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(invalidTask),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should validate task type enum', async () => {
      const newTask = {
        type: 'INVALID_TYPE', // Invalid type
        priority: 5,
        payload: { url: 'https://example.com' },
      }

      const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('type')
    })

    it('should validate priority range', async () => {
      const newTask = {
        type: 'CRAWL',
        priority: 11, // Invalid range (should be 1-10)
        payload: { url: 'https://example.com' },
      }

      const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('priority')
    })

    it('should validate max retries range', async () => {
      const newTask = {
        type: 'CRAWL',
        priority: 5,
        payload: { url: 'https://example.com' },
        maxRetries: -1, // Invalid range
      }

      const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('max retries')
    })

    it('should validate payload is valid JSON', async () => {
      const newTask = {
        type: 'CRAWL',
        priority: 5,
        payload: 'invalid-json', // Invalid JSON
      }

      const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.message).toContain('payload')
    })

    it('should set default values', async () => {
      const newTask = {
        type: 'CRAWL',
        payload: { url: 'https://example.com' },
        // priority and maxRetries not provided
      }

      const createdTask = testUtils.createMockTask({
        id: 'new-task-id',
        ...newTask,
        priority: 5, // Default value
        maxRetries: 3, // Default value
      })

      mockPrisma.task.create.mockResolvedValue(createdTask)

      const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: {
          ...newTask,
          status: 'PENDING',
          priority: 5,
          maxRetries: 3,
          retryCount: 0,
        },
      })
    })

    it('should handle creation errors', async () => {
      const newTask = {
        type: 'CRAWL',
        priority: 5,
        payload: { url: 'https://example.com' },
      }

      mockPrisma.task.create.mockRejectedValue(new Error('Creation failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Creation failed')
    })

    it('should handle different task types', async () => {
      const taskTypes = ['CRAWL', 'PARSE_PDF', 'GENERATE_ABSTRACT', 'INDEX_PAGE']
      
      for (const type of taskTypes) {
        const newTask = {
          type,
          priority: 5,
          payload: { test: 'data' },
        }

        const createdTask = testUtils.createMockTask({
          id: `new-task-${type}`,
          ...newTask,
        })

        mockPrisma.task.create.mockResolvedValue(createdTask)

        const request = new NextRequest('http://localhost:3000/api/v1/tasks', {
          method: 'POST',
          body: JSON.stringify(newTask),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data.success).toBe(true)
        expect(data.data.type).toBe(type)
      }
    })
  })
})
