/**
 * Integration Tests for Authors API
 * 
 * These tests use real database connections and test actual API endpoints.
 * They verify the complete flow from HTTP request to database operations.
 */

describe('Authors API Integration Tests', () => {
  const { makeRequest, createTestInstitution, createTestAuthor } = global.integrationTestUtils

  describe('GET /api/v1/authors', () => {
    it('should return empty list when no authors exist', async () => {
      const response = await makeRequest('GET', '/api/v1/authors')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toEqual([])
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination.total).toBe(0)
    })

    it('should return list of authors with real data and institution relations', async () => {
      // Create test institution and authors
      const institution = await createTestInstitution({
        name: 'Test University',
        type: 'UNIVERSITY',
        country: 'US'
      })

      const author1 = await createTestAuthor({
        name: 'John Doe',
        email: 'john@test.edu',
        orcid: '0000-0000-0000-0001',
        institution_id: institution.id
      })

      const author2 = await createTestAuthor({
        name: 'Jane Smith',
        email: 'jane@test.edu',
        orcid: '0000-0000-0000-0002',
        institution_id: institution.id
      })

      const response = await makeRequest('GET', '/api/v1/authors')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(2)
      expect(response.data.pagination.total).toBe(2)
      
      // Verify author data includes institution information
      const authorNames = response.data.data.map(author => author.name)
      expect(authorNames).toContain('John Doe')
      expect(authorNames).toContain('Jane Smith')

      // Verify institution relation is included
      const johnAuthor = response.data.data.find(a => a.name === 'John Doe')
      expect(johnAuthor).toHaveProperty('institution')
      expect(johnAuthor.institution.name).toBe('Test University')
    })

    it('should support pagination with real data', async () => {
      const institution = await createTestInstitution()
      
      // Create multiple authors
      for (let i = 1; i <= 5; i++) {
        await createTestAuthor({
          name: `Author ${i}`,
          email: `author${i}@test.edu`,
          orcid: `0000-0000-0000-000${i}`,
          institution_id: institution.id
        })
      }

      // Test first page
      const page1 = await makeRequest('GET', '/api/v1/authors?page=1&limit=2')
      expect(page1.status).toBe(200)
      expect(page1.data.data).toHaveLength(2)
      expect(page1.data.pagination.page).toBe(1)
      expect(page1.data.pagination.total).toBe(5)
    })

    it('should support search functionality with real data', async () => {
      const institution = await createTestInstitution()
      
      await createTestAuthor({
        name: 'Alice Johnson',
        email: 'alice@test.edu',
        institution_id: institution.id
      })
      
      await createTestAuthor({
        name: 'Bob Johnson',
        email: 'bob@test.edu',
        institution_id: institution.id
      })

      // Search for "Johnson"
      const response = await makeRequest('GET', '/api/v1/authors?search=Johnson')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(2)
      
      // Search for "Alice"
      const aliceResponse = await makeRequest('GET', '/api/v1/authors?search=Alice')
      expect(aliceResponse.status).toBe(200)
      expect(aliceResponse.data.data).toHaveLength(1)
      expect(aliceResponse.data.data[0].name).toBe('Alice Johnson')
    })

    it('should support filtering by institution with real data', async () => {
      const institution1 = await createTestInstitution({ name: 'University A' })
      const institution2 = await createTestInstitution({ name: 'University B' })
      
      await createTestAuthor({
        name: 'Author A',
        email: 'authora@universitya.edu',
        institution_id: institution1.id
      })
      
      await createTestAuthor({
        name: 'Author B',
        email: 'authorb@universityb.edu',
        institution_id: institution2.id
      })

      // Filter by institution
      const response = await makeRequest('GET', `/api/v1/authors?institution_id=${institution1.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].institution.id).toBe(institution1.id)
    })
  })

  describe('POST /api/v1/authors', () => {
    it('should create author with real database persistence and institution relation', async () => {
      const institution = await createTestInstitution()
      
      const authorData = {
        name: 'Test Author',
        email: 'test@example.com',
        orcid: '0000-0000-0000-0000',
        institution_id: institution.id,
        bio: 'Test author bio'
      }

      const response = await makeRequest('POST', '/api/v1/authors', authorData)
      
      expect(response.status).toBe(201)
      expect(response.data.data).toMatchObject({
        name: authorData.name,
        email: authorData.email,
        orcid: authorData.orcid,
        bio: authorData.bio
      })
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('created_at')
      expect(response.data.data).toHaveProperty('updated_at')

      // Verify data was actually saved to database
      const { prisma } = require('../../../../src/lib/prisma')
      const savedAuthor = await prisma.author.findUnique({
        where: { id: response.data.data.id },
        include: { institution: true }
      })
      expect(savedAuthor).toBeTruthy()
      expect(savedAuthor.name).toBe(authorData.name)
      expect(savedAuthor.institution.name).toBe(institution.name)
    })

    it('should validate required fields with real database', async () => {
      const invalidData = {
        email: 'test@example.com',
        orcid: '0000-0000-0000-0000'
        // Missing required 'name' field
      }

      const response = await makeRequest('POST', '/api/v1/authors', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('name')
    })

    it('should validate email format with real database', async () => {
      const institution = await createTestInstitution()
      
      const invalidData = {
        name: 'Test Author',
        email: 'invalid-email',
        orcid: '0000-0000-0000-0000',
        institution_id: institution.id
      }

      const response = await makeRequest('POST', '/api/v1/authors', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('email')
    })

    it('should validate ORCID format with real database', async () => {
      const institution = await createTestInstitution()
      
      const invalidData = {
        name: 'Test Author',
        email: 'test@example.com',
        orcid: 'invalid-orcid',
        institution_id: institution.id
      }

      const response = await makeRequest('POST', '/api/v1/authors', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('orcid')
    })


  })

  describe('GET /api/v1/authors/[id]', () => {
    it('should return author by ID with real database lookup and relations', async () => {
      const institution = await createTestInstitution({
        name: 'Test University',
        type: 'UNIVERSITY',
        country: 'US'
      })
      
      const author = await createTestAuthor({
        name: 'Test Author',
        email: 'test@example.com',
        orcid: '0000-0000-0000-0000',
        institution_id: institution.id
      })

      const response = await makeRequest('GET', `/api/v1/authors/${author.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: author.id,
        name: author.name,
        email: author.email,
        orcid: author.orcid
      })
      expect(response.data.data).toHaveProperty('institution')
      expect(response.data.data.institution.name).toBe('Test University')
    })

    it('should return 404 for non-existent author', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      
      const response = await makeRequest('GET', `/api/v1/authors/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
      expect(response.data.success).toBe(false)
    })

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid'
      
      const response = await makeRequest('GET', `/api/v1/authors/${invalidId}`)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.success).toBe(false)
    })
  })

  describe('PUT /api/v1/authors/[id]', () => {
    it('should update author with real database persistence', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({
        name: 'Original Name',
        email: 'original@example.com',
        institution_id: institution.id
      })

      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        bio: 'Updated bio'
      }

      const response = await makeRequest('PUT', `/api/v1/authors/${author.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: author.id,
        name: updateData.name,
        email: updateData.email,
        bio: updateData.bio,
        orcid: author.orcid, // Should remain unchanged
        institution_id: author.institutionId // Should remain unchanged
      })

      // Verify update in database
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedAuthor = await prisma.author.findUnique({
        where: { id: author.id }
      })
      expect(updatedAuthor.name).toBe(updateData.name)
      expect(updatedAuthor.email).toBe(updateData.email)
    })

    it('should return 404 when updating non-existent author', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const updateData = { name: 'Updated Name' }

      const response = await makeRequest('PUT', `/api/v1/authors/${fakeId}`, updateData)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
      expect(response.data.success).toBe(false)
    })

    it('should validate update data with real database', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const invalidData = { email: 'invalid-email' }

      const response = await makeRequest('PUT', `/api/v1/authors/${author.id}`, invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.success).toBe(false)
    })

    it('should handle institution change with real database', async () => {
      const institution1 = await createTestInstitution({ name: 'University A' })
      const institution2 = await createTestInstitution({ name: 'University B' })
      
      const author = await createTestAuthor({
        name: 'Test Author',
        institution_id: institution1.id
      })

      const updateData = { institution_id: institution2.id }

      const response = await makeRequest('PUT', `/api/v1/authors/${author.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data.institution_id).toBe(institution2.id)

      // Verify institution change in database
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedAuthor = await prisma.author.findUnique({
        where: { id: author.id },
        include: { institution: true }
      })
      expect(updatedAuthor.institution.name).toBe('University B')
    })
  })

  describe('DELETE /api/v1/authors/[id]', () => {
    it('should delete author with real database removal', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({
        name: 'To Be Deleted',
        institution_id: institution.id
      })

      const response = await makeRequest('DELETE', `/api/v1/authors/${author.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      expect(response.data.message).toContain('deleted')

      // Verify deletion from database
      const { prisma } = require('../../../../src/lib/prisma')
      const deletedAuthor = await prisma.author.findUnique({
        where: { id: author.id }
      })
      expect(deletedAuthor).toBeNull()
    })

    it('should return 404 when deleting non-existent author', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await makeRequest('DELETE', `/api/v1/authors/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
      expect(response.data.success).toBe(false)
    })

    it('should handle cascade deletion with related papers', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      
      // Create a paper with this author
      const { prisma } = require('../../../../src/lib/prisma')
      const paper = await prisma.paper.create({
        data: {
          title: 'Test Paper',
          abstract: 'Test abstract',
          status: 'PUBLISHED',
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      // Delete author
      const response = await makeRequest('DELETE', `/api/v1/authors/${author.id}`)
      
      expect(response.status).toBe(200)

      // Verify author is deleted but paper remains
      const deletedAuthor = await prisma.author.findUnique({
        where: { id: author.id }
      })
      expect(deletedAuthor).toBeNull()

      const remainingPaper = await prisma.paper.findUnique({
        where: { id: paper.id }
      })
      expect(remainingPaper).toBeTruthy()
    })
  })

  describe('Database Transaction Tests', () => {
    it('should handle concurrent author creation requests', async () => {
      const institution = await createTestInstitution()
      
      const authorData = {
        name: 'Concurrent Test Author',
        email: 'concurrent@test.edu',
        orcid: '0000-0000-0000-0000',
        institution_id: institution.id
      }

      // Create multiple concurrent requests with same ORCID
      const promises = Array(3).fill(null).map(() => 
        makeRequest('POST', '/api/v1/authors', authorData)
      )

      const responses = await Promise.all(promises)
      
      // Only one should succeed (201), others should fail (500 due to Prisma constraint error)
      const successCount = responses.filter(r => r.status === 201).length
      const errorCount = responses.filter(r => r.status === 500).length
      
      expect(successCount).toBe(1)
      expect(errorCount).toBe(2)
    })

    it('should maintain data consistency during updates', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({
        name: 'Consistency Test',
        institution_id: institution.id
      })

      // Concurrent updates
      const update1 = makeRequest('PUT', `/api/v1/authors/${author.id}`, {
        name: 'Updated Name 1'
      })
      const update2 = makeRequest('PUT', `/api/v1/authors/${author.id}`, {
        name: 'Updated Name 2'
      })

      const [response1, response2] = await Promise.all([update1, update2])
      
      // Both should succeed (database handles concurrency)
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Verify final state in database
      const { prisma } = require('../../../../src/lib/prisma')
      const finalAuthor = await prisma.author.findUnique({
        where: { id: author.id }
      })
      expect(finalAuthor).toBeTruthy()
      expect(['Updated Name 1', 'Updated Name 2']).toContain(finalAuthor.name)
    })
  })
})
