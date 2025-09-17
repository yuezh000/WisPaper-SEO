/**
 * Integration Tests for Institutions API
 * 
 * These tests use real database connections and test actual API endpoints.
 * They verify the complete flow from HTTP request to database operations.
 */

describe('Institutions API Integration Tests', () => {
  const { makeRequest, createTestInstitution, cleanupDatabase } = global.integrationTestUtils

  describe('GET /api/v1/institutions', () => {
    it('should return empty list when no institutions exist', async () => {
      const response = await makeRequest('GET', '/api/v1/institutions')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toEqual([])
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination.total).toBe(0)
    })

    it('should return list of institutions with real data', async () => {
      // Create test institutions in database
      const institution1 = await createTestInstitution({
        name: 'Harvard University',
        type: 'UNIVERSITY',
        country: 'US'
      })
      
      const institution2 = await createTestInstitution({
        name: 'MIT',
        type: 'UNIVERSITY', 
        country: 'US'
      })

      const response = await makeRequest('GET', '/api/v1/institutions')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(2)
      expect(response.data.pagination.total).toBe(2)
      
      // Verify institution data
      const institutionNames = response.data.data.map(inst => inst.name)
      expect(institutionNames).toContain('Harvard University')
      expect(institutionNames).toContain('MIT')
    })

    it('should support pagination with real data', async () => {
      // Create multiple institutions
      for (let i = 1; i <= 5; i++) {
        await createTestInstitution({
          name: `University ${i}`,
          type: 'UNIVERSITY',
          country: 'US'
        })
      }

      // Test first page
      const page1 = await makeRequest('GET', '/api/v1/institutions?page=1&limit=2')
      expect(page1.status).toBe(200)
      expect(page1.data.data).toHaveLength(2)
      expect(page1.data.pagination.page).toBe(1)
      expect(page1.data.pagination.limit).toBe(2)
      expect(page1.data.pagination.total).toBe(5)

      // Test second page
      const page2 = await makeRequest('GET', '/api/v1/institutions?page=2&limit=2')
      expect(page2.status).toBe(200)
      expect(page2.data.data).toHaveLength(2)
      expect(page2.data.pagination.page).toBe(2)
    })

    it('should support search functionality with real data', async () => {
      // Create institutions with different names
      await createTestInstitution({ name: 'Stanford University', country: 'US' })
      await createTestInstitution({ name: 'Oxford University', country: 'UK' })
      await createTestInstitution({ name: 'Cambridge University', country: 'UK' })

      // Search for "University"
      const response = await makeRequest('GET', '/api/v1/institutions?search=University')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(3)
      
      // Search for "Stanford"
      const stanfordResponse = await makeRequest('GET', '/api/v1/institutions?search=Stanford')
      expect(stanfordResponse.status).toBe(200)
      expect(stanfordResponse.data.data).toHaveLength(1)
      expect(stanfordResponse.data.data[0].name).toBe('Stanford University')
    })

    it('should support filtering by type with real data', async () => {
      // Create institutions of different types
      await createTestInstitution({ name: 'Harvard', type: 'UNIVERSITY' })
      await createTestInstitution({ name: 'Google Research', type: 'RESEARCH_INSTITUTE' })
      await createTestInstitution({ name: 'Microsoft', type: 'COMPANY' })

      // Filter by university type
      const response = await makeRequest('GET', '/api/v1/institutions?type=UNIVERSITY')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].type).toBe('UNIVERSITY')
    })
  })

  describe('POST /api/v1/institutions', () => {
    it('should create institution with real database persistence', async () => {
      const institutionData = {
        name: 'Test University',
        type: 'UNIVERSITY',
        country: 'US',
        city: 'Test City',
        website: 'https://test.edu'
      }

      const response = await makeRequest('POST', '/api/v1/institutions', institutionData)
      
      expect(response.status).toBe(201)
      expect(response.data.data).toMatchObject({
        name: institutionData.name,
        type: institutionData.type,
        country: institutionData.country,
        city: institutionData.city,
        website: institutionData.website
      })
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('created_at')
      expect(response.data.data).toHaveProperty('updated_at')

      // Verify data was actually saved to database
      const { prisma } = require('../../../../src/lib/prisma')
      const savedInstitution = await prisma.institution.findUnique({
        where: { id: response.data.data.id }
      })
      expect(savedInstitution).toBeTruthy()
      expect(savedInstitution.name).toBe(institutionData.name)
    })

    it('should validate required fields with real database', async () => {
      const invalidData = {
        type: 'UNIVERSITY',
        country: 'US'
        // Missing required 'name' field
      }

      const response = await makeRequest('POST', '/api/v1/institutions', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('name')
    })

    it('should validate institution type enum with real database', async () => {
      const invalidData = {
        name: 'Test University',
        type: 'INVALID_TYPE',
        country: 'US'
      }

      const response = await makeRequest('POST', '/api/v1/institutions', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

  })

  describe('GET /api/v1/institutions/[id]', () => {
    it('should return institution by ID with real database lookup', async () => {
      // Create institution in database
      const institution = await createTestInstitution({
        name: 'Test University',
        type: 'UNIVERSITY',
        country: 'US'
      })

      const response = await makeRequest('GET', `/api/v1/institutions/${institution.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: institution.id,
        name: institution.name,
        type: institution.type,
        country: institution.country
      })
    })

    it('should return 404 for non-existent institution', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      
      const response = await makeRequest('GET', `/api/v1/institutions/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid'
      
      const response = await makeRequest('GET', `/api/v1/institutions/${invalidId}`)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('PUT /api/v1/institutions/[id]', () => {
    it('should update institution with real database persistence', async () => {
      // Create institution in database
      const institution = await createTestInstitution({
        name: 'Original Name',
        type: 'UNIVERSITY',
        country: 'US'
      })

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        website: 'https://updated.edu'
      }

      const response = await makeRequest('PUT', `/api/v1/institutions/${institution.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: institution.id,
        name: updateData.name,
        description: updateData.description,
        website: updateData.website,
        type: institution.type, // Should remain unchanged
        country: institution.country // Should remain unchanged
      })

      // Verify update in database
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedInstitution = await prisma.institution.findUnique({
        where: { id: institution.id }
      })
      expect(updatedInstitution.name).toBe(updateData.name)
      expect(updatedInstitution.description).toBe(updateData.description)
    })

    it('should return 404 when updating non-existent institution', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const updateData = { name: 'Updated Name' }

      const response = await makeRequest('PUT', `/api/v1/institutions/${fakeId}`, updateData)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should validate update data with real database', async () => {
      const institution = await createTestInstitution()
      const invalidData = { type: 'INVALID_TYPE' }

      const response = await makeRequest('PUT', `/api/v1/institutions/${institution.id}`, invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('DELETE /api/v1/institutions/[id]', () => {
    it('should delete institution with real database removal', async () => {
      // Create institution in database
      const institution = await createTestInstitution({
        name: 'To Be Deleted',
        type: 'UNIVERSITY',
        country: 'US'
      })

      const response = await makeRequest('DELETE', `/api/v1/institutions/${institution.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      expect(response.data.message).toContain('deleted')

      // Verify deletion from database
      const { prisma } = require('../../../../src/lib/prisma')
      const deletedInstitution = await prisma.institution.findUnique({
        where: { id: institution.id }
      })
      expect(deletedInstitution).toBeNull()
    })

    it('should return 404 when deleting non-existent institution', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await makeRequest('DELETE', `/api/v1/institutions/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should handle cascade deletion with related authors', async () => {
      // Create institution and author
      const institution = await createTestInstitution()
      const { createTestAuthor } = global.integrationTestUtils
      const author = await createTestAuthor({ institutionId: institution.id })

      // Delete institution
      const response = await makeRequest('DELETE', `/api/v1/institutions/${institution.id}`)
      
      expect(response.status).toBe(200)

      // Verify author still exists but institutionId is null
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedAuthor = await prisma.author.findUnique({
        where: { id: author.id }
      })
      expect(updatedAuthor).toBeTruthy()
      expect(updatedAuthor.institutionId).toBeNull()
    })
  })

  describe('Database Transaction Tests', () => {
    it('should handle concurrent creation requests', async () => {
      const institutionData = {
        name: 'Concurrent Test University',
        type: 'UNIVERSITY',
        country: 'US'
      }

      // Create multiple concurrent requests
      const promises = Array(3).fill(null).map(() => 
        makeRequest('POST', '/api/v1/institutions', institutionData)
      )

      const responses = await Promise.all(promises)
      
      // Only one should succeed (201), others should fail (400)
      const successCount = responses.filter(r => r.status === 201).length
      const errorCount = responses.filter(r => r.status === 400).length
      
      expect(successCount).toBe(1)
      expect(errorCount).toBe(2)
    })

    it('should maintain data consistency during updates', async () => {
      const institution = await createTestInstitution({
        name: 'Consistency Test',
        type: 'UNIVERSITY',
        country: 'US'
      })

      // Concurrent updates
      const update1 = makeRequest('PUT', `/api/v1/institutions/${institution.id}`, {
        name: 'Updated Name 1'
      })
      const update2 = makeRequest('PUT', `/api/v1/institutions/${institution.id}`, {
        name: 'Updated Name 2'
      })

      const [response1, response2] = await Promise.all([update1, update2])
      
      // Both should succeed (database handles concurrency)
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Verify final state in database
      const { prisma } = require('../../../../src/lib/prisma')
      const finalInstitution = await prisma.institution.findUnique({
        where: { id: institution.id }
      })
      expect(finalInstitution).toBeTruthy()
      expect(['Updated Name 1', 'Updated Name 2']).toContain(finalInstitution.name)
    })
  })
})
