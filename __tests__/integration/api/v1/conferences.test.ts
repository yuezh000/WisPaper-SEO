/**
 * Integration Tests for Conferences API
 * 
 * These tests use real database connections and test actual API endpoints.
 * They verify the complete flow from HTTP request to database operations.
 */

describe('Conferences API Integration Tests', () => {
  const { makeRequest, createTestConference } = global.integrationTestUtils

  describe('GET /api/v1/conferences', () => {
    it('should return empty list when no conferences exist', async () => {
      const response = await makeRequest('GET', '/api/v1/conferences')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toEqual([])
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination.total).toBe(0)
    })

    it('should return list of conferences with real data', async () => {
      // Create test conferences in database
      const conference1 = await createTestConference({
        name: 'International Conference on AI',
        acronym: 'ICAI',
        description: 'Leading AI conference',
        website: 'https://icai.org',
        status: 'UPCOMING'
      })
      
      const conference2 = await createTestConference({
        name: 'Machine Learning Summit',
        acronym: 'MLS',
        description: 'Annual ML conference',
        website: 'https://mlsummit.org',
        status: 'UPCOMING'
      })

      const response = await makeRequest('GET', '/api/v1/conferences')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(2)
      expect(response.data.pagination.total).toBe(2)
      
      // Verify conference data
      const conferenceNames = response.data.data.map(conf => conf.name)
      expect(conferenceNames).toContain('International Conference on AI')
      expect(conferenceNames).toContain('Machine Learning Summit')
    })

    it('should support pagination with real data', async () => {
      // Create multiple conferences
      for (let i = 1; i <= 5; i++) {
        await createTestConference({
          name: `Conference ${i}`,
          acronym: `C${i}`,
          description: `Description for conference ${i}`
        })
      }

      // Test first page
      const page1 = await makeRequest('GET', '/api/v1/conferences?page=1&limit=2')
      expect(page1.status).toBe(200)
      expect(page1.data.data).toHaveLength(2)
      expect(page1.data.pagination.page).toBe(1)
      expect(page1.data.pagination.limit).toBe(2)
      expect(page1.data.pagination.total).toBe(5)

      // Test second page
      const page2 = await makeRequest('GET', '/api/v1/conferences?page=2&limit=2')
      expect(page2.status).toBe(200)
      expect(page2.data.data).toHaveLength(2)
      expect(page2.data.pagination.page).toBe(2)
    })

    it('should support search functionality with real data', async () => {
      // Create conferences with different names
      await createTestConference({ 
        name: 'Artificial Intelligence Conference',
        description: 'AI research conference'
      })
      await createTestConference({ 
        name: 'Machine Learning Workshop',
        description: 'ML techniques workshop'
      })
      await createTestConference({ 
        name: 'Data Science Summit',
        description: 'Data science conference'
      })

      // Search for "AI"
      const response = await makeRequest('GET', '/api/v1/conferences?search=AI')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].name).toBe('Artificial Intelligence Conference')
    })

    it('should support filtering by status with real data', async () => {
      // Create conferences with different statuses
      await createTestConference({ 
        name: 'Active Conference',
        status: 'UPCOMING'
      })
      await createTestConference({ 
        name: 'Inactive Conference',
        status: 'COMPLETED'
      })
      await createTestConference({ 
        name: 'Cancelled Conference',
        status: 'COMPLETED'
      })

      // Filter by active status
      const response = await makeRequest('GET', '/api/v1/conferences?status=UPCOMING')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].status).toBe('UPCOMING')
    })

    it('should support filtering by date range with real data', async () => {
      const futureDate = new Date('2025-12-31')
      const pastDate = new Date('2023-01-01')
      
      await createTestConference({
        name: 'Future Conference',
        conferenceDate: futureDate
      })
      
      await createTestConference({
        name: 'Past Conference',
        conferenceDate: pastDate
      })

      // Filter by future conferences
      const response = await makeRequest('GET', '/api/v1/conferences?dateFrom=2025-01-01')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].name).toBe('Future Conference')
    })
  })

  describe('POST /api/v1/conferences', () => {
    it('should create conference with real database persistence', async () => {
      const conferenceData = {
        name: 'Test Conference',
        acronym: 'TC',
        description: 'A test conference for integration testing',
        website: 'https://test-conference.org',
        status: 'UPCOMING',
        submission_deadline: '2024-12-31',
        conference_date: '2025-01-15'
      }

      const response = await makeRequest('POST', '/api/v1/conferences', conferenceData)
      
      expect(response.status).toBe(201)
      expect(response.data.data).toMatchObject({
        name: conferenceData.name,
        acronym: conferenceData.acronym,
        description: conferenceData.description,
        website: conferenceData.website,
        status: conferenceData.status
      })
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('created_at')
      expect(response.data.data).toHaveProperty('updated_at')

      // Verify data was actually saved to database
      const { prisma } = require('../../../../src/lib/prisma')
      const savedConference = await prisma.conference.findUnique({
        where: { id: response.data.data.id }
      })
      expect(savedConference).toBeTruthy()
      expect(savedConference.name).toBe(conferenceData.name)
    })

    it('should validate required fields with real database', async () => {
      const invalidData = {
        acronym: 'TC',
        description: 'Test conference'
        // Missing required 'name' field
      }

      const response = await makeRequest('POST', '/api/v1/conferences', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('name')
    })

    it('should validate conference status enum with real database', async () => {
      const invalidData = {
        name: 'Test Conference',
        status: 'INVALID_STATUS'
      }

      const response = await makeRequest('POST', '/api/v1/conferences', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

    it('should validate date logic with real database', async () => {
      const invalidData = {
        name: 'Test Conference',
        status: 'UPCOMING',
        submissionDeadline: '2025-01-15', // After conference date
        conferenceDate: '2024-12-31'
      }

      const response = await makeRequest('POST', '/api/v1/conferences', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('deadline')
    })

    it('should validate website URL format with real database', async () => {
      const invalidData = {
        name: 'Test Conference',
        status: 'UPCOMING',
        website: 'invalid-url'
      }

      const response = await makeRequest('POST', '/api/v1/conferences', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('website')
    })

  })

  describe('GET /api/v1/conferences/[id]', () => {
    it('should return conference by ID with real database lookup', async () => {
      // Create conference in database
      const conference = await createTestConference({
        name: 'Test Conference',
        acronym: 'TC',
        description: 'Test conference description',
        status: 'UPCOMING'
      })

      const response = await makeRequest('GET', `/api/v1/conferences/${conference.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: conference.id,
        name: conference.name,
        acronym: conference.acronym,
        description: conference.description,
        status: conference.status
      })
    })

    it('should return 404 for non-existent conference', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      
      const response = await makeRequest('GET', `/api/v1/conferences/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid'
      
      const response = await makeRequest('GET', `/api/v1/conferences/${invalidId}`)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('PUT /api/v1/conferences/[id]', () => {
    it('should update conference with real database persistence', async () => {
      // Create conference in database
      const conference = await createTestConference({
        name: 'Original Name',
        acronym: 'ON',
        description: 'Original description',
        status: 'UPCOMING'
      })

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
        website: 'https://updated-conference.org'
      }

      const response = await makeRequest('PUT', `/api/v1/conferences/${conference.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: conference.id,
        name: updateData.name,
        description: updateData.description,
        website: updateData.website,
        acronym: conference.acronym, // Should remain unchanged
        status: conference.status // Should remain unchanged
      })

      // Verify update in database
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedConference = await prisma.conference.findUnique({
        where: { id: conference.id }
      })
      expect(updatedConference.name).toBe(updateData.name)
      expect(updatedConference.description).toBe(updateData.description)
    })

    it('should return 404 when updating non-existent conference', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const updateData = { name: 'Updated Name' }

      const response = await makeRequest('PUT', `/api/v1/conferences/${fakeId}`, updateData)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should validate update data with real database', async () => {
      const conference = await createTestConference()
      const invalidData = { status: 'INVALID_STATUS' }

      const response = await makeRequest('PUT', `/api/v1/conferences/${conference.id}`, invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })

    it('should handle status transitions with real database', async () => {
      const conference = await createTestConference({
        name: 'Status Test Conference',
        status: 'UPCOMING'
      })

      // Update to cancelled
      const updateData = { status: 'COMPLETED' }
      const response = await makeRequest('PUT', `/api/v1/conferences/${conference.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data.status).toBe('COMPLETED')

      // Verify status change in database
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedConference = await prisma.conference.findUnique({
        where: { id: conference.id }
      })
      expect(updatedConference.status).toBe('COMPLETED')
    })
  })

  describe('DELETE /api/v1/conferences/[id]', () => {
    it('should delete conference with real database removal', async () => {
      // Create conference in database
      const conference = await createTestConference({
        name: 'To Be Deleted',
        acronym: 'TBD'
      })

      const response = await makeRequest('DELETE', `/api/v1/conferences/${conference.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      expect(response.data.message).toContain('deleted')

      // Verify deletion from database
      const { prisma } = require('../../../../src/lib/prisma')
      const deletedConference = await prisma.conference.findUnique({
        where: { id: conference.id }
      })
      expect(deletedConference).toBeNull()
    })

    it('should return 404 when deleting non-existent conference', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await makeRequest('DELETE', `/api/v1/conferences/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should handle cascade deletion with related papers', async () => {
      const conference = await createTestConference()
      
      // Create a paper with this conference
      const { prisma } = require('../../../../src/lib/prisma')
      const institution = await global.integrationTestUtils.createTestInstitution()
      const author = await global.integrationTestUtils.createTestAuthor({ institutionId: institution.id })
      
      const paper = await prisma.paper.create({
        data: {
          title: 'Test Paper',
          abstract: 'Test abstract',
          status: 'PUBLISHED',
          conferenceId: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true
            }
          }
        }
      })

      // Delete conference
      const response = await makeRequest('DELETE', `/api/v1/conferences/${conference.id}`)
      
      expect(response.status).toBe(200)

      // Verify conference is deleted but paper remains with null conferenceId
      const deletedConference = await prisma.conference.findUnique({
        where: { id: conference.id }
      })
      expect(deletedConference).toBeNull()

      const remainingPaper = await prisma.paper.findUnique({
        where: { id: paper.id }
      })
      expect(remainingPaper).toBeTruthy()
      expect(remainingPaper.conferenceId).toBeNull()
    })
  })

  describe('Business Logic Tests', () => {
    it('should handle conference lifecycle with real database', async () => {
      // Create conference in planning phase
      const conferenceData = {
        name: 'Lifecycle Test Conference',
        acronym: 'LTC',
        status: 'UPCOMING',
        submissionDeadline: '2024-12-31',
        conferenceDate: '2025-01-15'
      }

      const response = await makeRequest('POST', '/api/v1/conferences', conferenceData)
      expect(response.status).toBe(201)
      expect(response.data.data.status).toBe('UPCOMING')

      // Update to active
      const activeUpdate = await makeRequest('PUT', `/api/v1/conferences/${response.data.data.id}`, {
        status: 'UPCOMING'
      })
      expect(activeUpdate.status).toBe(200)
      expect(activeUpdate.data.data.status).toBe('UPCOMING')

      // Update to completed
      const completedUpdate = await makeRequest('PUT', `/api/v1/conferences/${response.data.data.id}`, {
        status: 'COMPLETED'
      })
      expect(completedUpdate.status).toBe(200)
      expect(completedUpdate.data.data.status).toBe('COMPLETED')
    })

    it('should validate submission deadline before conference date', async () => {
      const conferenceData = {
        name: 'Date Validation Conference',
        acronym: 'DVC',
        submissionDeadline: '2025-01-15', // After conference date
        conferenceDate: '2024-12-31'
      }

      const response = await makeRequest('POST', '/api/v1/conferences', conferenceData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('deadline')
    })

    it('should handle conference with multiple papers', async () => {
      const conference = await createTestConference({
        name: 'Multi-Paper Conference',
        acronym: 'MPC'
      })

      const institution = await global.integrationTestUtils.createTestInstitution()
      const author = await global.integrationTestUtils.createTestAuthor({ institutionId: institution.id })
      
      // Create multiple papers for this conference
      const { prisma } = require('../../../../src/lib/prisma')
      for (let i = 1; i <= 3; i++) {
        await prisma.paper.create({
          data: {
            title: `Paper ${i}`,
            abstract: `Abstract for paper ${i}`,
            status: 'PUBLISHED',
            conferenceId: conference.id,
            authors: {
              create: {
                authorId: author.id,
                isCorresponding: true,
                order: 1
              }
            }
          }
        })
      }

      // Verify conference has papers
      const conferenceWithPapers = await prisma.conference.findUnique({
        where: { id: conference.id },
        include: { papers: true }
      })
      expect(conferenceWithPapers.papers).toHaveLength(3)
    })
  })

  describe('Database Transaction Tests', () => {
    it('should handle concurrent conference creation requests', async () => {
      const conferenceData = {
        name: 'Concurrent Test Conference',
        acronym: 'CTC'
      }

      // Create multiple concurrent requests
      const promises = Array(3).fill(null).map(() => 
        makeRequest('POST', '/api/v1/conferences', conferenceData)
      )

      const responses = await Promise.all(promises)
      
      // Only one should succeed (201), others should fail (400)
      const successCount = responses.filter(r => r.status === 201).length
      const errorCount = responses.filter(r => r.status === 400).length
      
      expect(successCount).toBe(1)
      expect(errorCount).toBe(2)
    })

    it('should maintain data consistency during updates', async () => {
      const conference = await createTestConference({
        name: 'Consistency Test',
        status: 'UPCOMING'
      })

      // Concurrent updates
      const update1 = makeRequest('PUT', `/api/v1/conferences/${conference.id}`, {
        name: 'Updated Name 1',
        status: 'COMPLETED'
      })
      const update2 = makeRequest('PUT', `/api/v1/conferences/${conference.id}`, {
        name: 'Updated Name 2',
        status: 'COMPLETED'
      })

      const [response1, response2] = await Promise.all([update1, update2])
      
      // Both should succeed (database handles concurrency)
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Verify final state in database
      const { prisma } = require('../../../../src/lib/prisma')
      const finalConference = await prisma.conference.findUnique({
        where: { id: conference.id }
      })
      expect(finalConference).toBeTruthy()
      expect(['Updated Name 1', 'Updated Name 2']).toContain(finalConference.name)
    })
  })
})
