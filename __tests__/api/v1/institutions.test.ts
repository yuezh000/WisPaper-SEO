import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/v1/institutions/route'
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/v1/institutions/[id]/route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    institution: {
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

describe('/api/v1/institutions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/v1/institutions', () => {
    it('should return list of institutions with pagination', async () => {
      const mockInstitutions = [
        testUtils.createMockInstitution({ id: '1', name: 'University A' }),
        testUtils.createMockInstitution({ id: '2', name: 'University B' }),
      ]

      mockPrisma.institution.findMany.mockResolvedValue(mockInstitutions)
      mockPrisma.institution.count.mockResolvedValue(2)

      const request = new NextRequest('http://localhost:3000/api/v1/institutions?page=1&limit=10')
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

    it('should filter institutions by search term', async () => {
      const mockInstitutions = [
        testUtils.createMockInstitution({ id: '1', name: 'Beijing University' }),
      ]

      mockPrisma.institution.findMany.mockResolvedValue(mockInstitutions)
      mockPrisma.institution.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/institutions?search=Beijing')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(mockPrisma.institution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: { contains: 'Beijing', mode: 'insensitive' } }),
            ]),
          }),
        })
      )
    })

    it('should filter institutions by type', async () => {
      const mockInstitutions = [
        testUtils.createMockInstitution({ id: '1', type: 'UNIVERSITY' }),
      ]

      mockPrisma.institution.findMany.mockResolvedValue(mockInstitutions)
      mockPrisma.institution.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/v1/institutions?type=UNIVERSITY')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockPrisma.institution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            type: 'UNIVERSITY',
          }),
        })
      )
    })

    it('should handle database errors', async () => {
      mockPrisma.institution.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/v1/institutions')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('POST /api/v1/institutions', () => {
    it('should create a new institution', async () => {
      const newInstitution = {
        name: 'New University',
        type: 'UNIVERSITY',
        country: 'China',
        city: 'Shanghai',
        website: 'https://new-university.edu.cn',
      }

      const createdInstitution = testUtils.createMockInstitution({
        id: 'new-id',
        ...newInstitution,
      })

      mockPrisma.institution.create.mockResolvedValue(createdInstitution)

      const request = new NextRequest('http://localhost:3000/api/v1/institutions', {
        method: 'POST',
        body: JSON.stringify(newInstitution),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(createdInstitution)
      expect(mockPrisma.institution.create).toHaveBeenCalledWith({
        data: newInstitution,
      })
    })

    it('should validate required fields', async () => {
      const invalidInstitution = {
        name: '', // Empty name
        type: 'UNIVERSITY',
      }

      const request = new NextRequest('http://localhost:3000/api/v1/institutions', {
        method: 'POST',
        body: JSON.stringify(invalidInstitution),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
    })

    it('should handle creation errors', async () => {
      const newInstitution = {
        name: 'New University',
        type: 'UNIVERSITY',
        country: 'China',
        city: 'Shanghai',
      }

      mockPrisma.institution.create.mockRejectedValue(new Error('Creation failed'))

      const request = new NextRequest('http://localhost:3000/api/v1/institutions', {
        method: 'POST',
        body: JSON.stringify(newInstitution),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Creation failed')
    })
  })
})

describe('/api/v1/institutions/[id]', () => {
  const institutionId = 'test-institution-id'

  describe('GET /api/v1/institutions/[id]', () => {
    it('should return institution by id', async () => {
      const mockInstitution = testUtils.createMockInstitution({ id: institutionId })

      mockPrisma.institution.findUnique.mockResolvedValue(mockInstitution)

      const request = new NextRequest(`http://localhost:3000/api/v1/institutions/${institutionId}`)
      const response = await GET_BY_ID(request, { params: { id: institutionId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockInstitution)
      expect(mockPrisma.institution.findUnique).toHaveBeenCalledWith({
        where: { id: institutionId },
        include: {
          authors: true,
        },
      })
    })

    it('should return 404 for non-existent institution', async () => {
      mockPrisma.institution.findUnique.mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/v1/institutions/${institutionId}`)
      const response = await GET_BY_ID(request, { params: { id: institutionId } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.message).toBe('Institution not found')
    })

    it('should handle database errors', async () => {
      mockPrisma.institution.findUnique.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest(`http://localhost:3000/api/v1/institutions/${institutionId}`)
      const response = await GET_BY_ID(request, { params: { id: institutionId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Database error')
    })
  })

  describe('PUT /api/v1/institutions/[id]', () => {
    it('should update institution', async () => {
      const updateData = {
        name: 'Updated University',
        city: 'Guangzhou',
      }

      const updatedInstitution = testUtils.createMockInstitution({
        id: institutionId,
        ...updateData,
      })

      mockPrisma.institution.update.mockResolvedValue(updatedInstitution)

      const request = new NextRequest(`http://localhost:3000/api/v1/institutions/${institutionId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: { id: institutionId } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(updatedInstitution)
      expect(mockPrisma.institution.update).toHaveBeenCalledWith({
        where: { id: institutionId },
        data: updateData,
      })
    })

    it('should handle update errors', async () => {
      const updateData = { name: 'Updated University' }

      mockPrisma.institution.update.mockRejectedValue(new Error('Update failed'))

      const request = new NextRequest(`http://localhost:3000/api/v1/institutions/${institutionId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await PUT(request, { params: { id: institutionId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Update failed')
    })
  })

  describe('DELETE /api/v1/institutions/[id]', () => {
    it('should delete institution', async () => {
      mockPrisma.institution.delete.mockResolvedValue(testUtils.createMockInstitution({ id: institutionId }))

      const request = new NextRequest(`http://localhost:3000/api/v1/institutions/${institutionId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: institutionId } })
      const data = await response.json()

      expect(response.status).toBe(204)
      expect(data.success).toBe(true)
      expect(mockPrisma.institution.delete).toHaveBeenCalledWith({
        where: { id: institutionId },
      })
    })

    it('should handle deletion errors', async () => {
      mockPrisma.institution.delete.mockRejectedValue(new Error('Deletion failed'))

      const request = new NextRequest(`http://localhost:3000/api/v1/institutions/${institutionId}`, {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: { id: institutionId } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Deletion failed')
    })
  })
})
