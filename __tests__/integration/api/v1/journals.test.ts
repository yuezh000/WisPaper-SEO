/**
 * Integration Tests for Journals API
 * 
 * These tests use real database connections and test actual API endpoints.
 * They verify the complete flow from HTTP request to database operations.
 */

describe('Journals API Integration Tests', () => {
  const { makeRequest, createTestJournal } = global.integrationTestUtils

  describe('GET /api/v1/journals', () => {
    it('should return empty list when no journals exist', async () => {
      const response = await makeRequest('GET', '/api/v1/journals')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toEqual([])
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination.total).toBe(0)
    })

    it('should return list of journals with real data', async () => {
      // Create test journals in database
      const journal1 = await createTestJournal({
        name: 'Nature',
        acronym: 'NAT',
        issn: '0028-0836',
        eissn: '1476-4687',
        description: 'International weekly journal of science',
        website: 'https://nature.com',
        publisher: 'Nature Publishing Group',
        impactFactor: 69.504,
        status: 'ACTIVE'
      })
      
      const journal2 = await createTestJournal({
        name: 'Science',
        acronym: 'SCI',
        issn: '0036-8075',
        eissn: '1095-9203',
        description: 'American Association for the Advancement of Science',
        website: 'https://science.org',
        publisher: 'AAAS',
        impactFactor: 47.728,
        status: 'ACTIVE'
      })

      const response = await makeRequest('GET', '/api/v1/journals')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(2)
      expect(response.data.pagination.total).toBe(2)
      
      // Verify journal data
      const journalNames = response.data.data.map(journal => journal.name)
      expect(journalNames).toContain('Nature')
      expect(journalNames).toContain('Science')
    })

    it('should support pagination with real data', async () => {
      // Create multiple journals
      for (let i = 1; i <= 5; i++) {
        await createTestJournal({
          name: `Journal ${i}`,
          acronym: `J${i}`,
          issn: `1234-567${i}`,
          impactFactor: i * 2.5
        })
      }

      // Test first page
      const page1 = await makeRequest('GET', '/api/v1/journals?page=1&limit=2')
      expect(page1.status).toBe(200)
      expect(page1.data.data).toHaveLength(2)
      expect(page1.data.pagination.page).toBe(1)
      expect(page1.data.pagination.limit).toBe(2)
      expect(page1.data.pagination.total).toBe(5)

      // Test second page
      const page2 = await makeRequest('GET', '/api/v1/journals?page=2&limit=2')
      expect(page2.status).toBe(200)
      expect(page2.data.data).toHaveLength(2)
      expect(page2.data.pagination.page).toBe(2)
    })

    it('should support search functionality with real data', async () => {
      // Create journals with different names
      await createTestJournal({ 
        name: 'Journal of Machine Learning Research',
        description: 'Machine learning research journal'
      })
      await createTestJournal({ 
        name: 'Nature Machine Intelligence',
        description: 'AI and machine intelligence journal'
      })
      await createTestJournal({ 
        name: 'Data Mining and Knowledge Discovery',
        description: 'Data mining research journal'
      })

      // Search for "Machine Learning"
      const response = await makeRequest('GET', '/api/v1/journals?search=Machine Learning')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].name).toBe('Journal of Machine Learning Research')
    })

    it('should support filtering by publisher with real data', async () => {
      // Create journals with different publishers
      await createTestJournal({ 
        name: 'Nature Journal',
        publisher: 'Nature Publishing Group'
      })
      await createTestJournal({ 
        name: 'Science Journal',
        publisher: 'AAAS'
      })
      await createTestJournal({ 
        name: 'IEEE Journal',
        publisher: 'IEEE'
      })

      // Filter by publisher
      const response = await makeRequest('GET', '/api/v1/journals?publisher=Nature Publishing Group')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].publisher).toBe('Nature Publishing Group')
    })

    it('should support filtering by status with real data', async () => {
      // Create journals with different statuses
      await createTestJournal({ 
        name: 'Active Journal',
        status: 'ACTIVE'
      })
      await createTestJournal({ 
        name: 'Inactive Journal',
        status: 'INACTIVE'
      })
      await createTestJournal({ 
        name: 'Suspended Journal',
        status: 'SUSPENDED'
      })

      // Filter by active status
      const response = await makeRequest('GET', '/api/v1/journals?status=ACTIVE')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].status).toBe('ACTIVE')
    })

    it('should support filtering by impact factor range with real data', async () => {
      // Create journals with different impact factors
      await createTestJournal({ 
        name: 'High Impact Journal',
        impactFactor: 10.5
      })
      await createTestJournal({ 
        name: 'Medium Impact Journal',
        impactFactor: 5.2
      })
      await createTestJournal({ 
        name: 'Low Impact Journal',
        impactFactor: 1.8
      })

      // Filter by high impact factor
      const response = await makeRequest('GET', '/api/v1/journals?minImpactFactor=5.0')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(2)
      expect(response.data.data.every(j => j.impactFactor >= 5.0)).toBe(true)
    })
  })

  describe('POST /api/v1/journals', () => {
    it('should create journal with real database persistence', async () => {
      const journalData = {
        name: 'Test Journal',
        acronym: 'TJ',
        issn: '1234-5678',
        eissn: '9876-5432',
        description: 'A test journal for integration testing',
        website: 'https://test-journal.org',
        publisher: 'Test Publisher',
        impact_factor: 2.5,
        status: 'ACTIVE'
      }

      const response = await makeRequest('POST', '/api/v1/journals', journalData)
      
      expect(response.status).toBe(201)
      expect(response.data.data).toMatchObject({
        name: journalData.name,
        acronym: journalData.acronym,
        issn: journalData.issn,
        eissn: journalData.eissn,
        description: journalData.description,
        website: journalData.website,
        publisher: journalData.publisher,
        impact_factor: journalData.impact_factor,
        status: journalData.status
      })
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('created_at')
      expect(response.data.data).toHaveProperty('updated_at')

      // Verify data was actually saved to database
      const { prisma } = require('../../../../src/lib/prisma')
      const savedJournal = await prisma.journal.findUnique({
        where: { id: response.data.data.id }
      })
      expect(savedJournal).toBeTruthy()
      expect(savedJournal.name).toBe(journalData.name)
    })

    it('should validate required fields with real database', async () => {
      const invalidData = {
        acronym: 'TJ',
        issn: '1234-5678'
        // Missing required 'name' field
      }

      const response = await makeRequest('POST', '/api/v1/journals', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('name')
    })


    it('should validate ISSN format with real database', async () => {
      const invalidData = {
        name: 'Test Journal',
        issn: 'invalid-issn'
      }

      const response = await makeRequest('POST', '/api/v1/journals', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('ISSN')
    })

    it('should validate eISSN format with real database', async () => {
      const invalidData = {
        name: 'Test Journal',
        eissn: 'invalid-eissn'
      }

      const response = await makeRequest('POST', '/api/v1/journals', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('eISSN')
    })

    it('should validate impact factor range with real database', async () => {
      const invalidData = {
        name: 'Test Journal',
        impactFactor: -1.5 // Invalid: should be >= 0
      }

      const response = await makeRequest('POST', '/api/v1/journals', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('impact factor')
    })

    it('should validate website URL format with real database', async () => {
      const invalidData = {
        name: 'Test Journal',
        website: 'invalid-url'
      }

      const response = await makeRequest('POST', '/api/v1/journals', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('website')
    })


  })

  describe('GET /api/v1/journals/[id]', () => {
    it('should return journal by ID with real database lookup', async () => {
      // Create journal in database
      const journal = await createTestJournal({
        name: 'Test Journal',
        acronym: 'TJ',
        issn: '1234-5678',
        impactFactor: 3.5,
        status: 'ACTIVE'
      })

      const response = await makeRequest('GET', `/api/v1/journals/${journal.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: journal.id,
        name: journal.name,
        acronym: journal.acronym,
        issn: journal.issn,
        impact_factor: journal.impactFactor,
        status: journal.status
      })
    })

    it('should return 404 for non-existent journal', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      
      const response = await makeRequest('GET', `/api/v1/journals/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
    })

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid'
      
      const response = await makeRequest('GET', `/api/v1/journals/${invalidId}`)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
    })
  })

  describe('PUT /api/v1/journals/[id]', () => {
    it('should update journal with real database persistence', async () => {
      // Create journal in database
      const journal = await createTestJournal({
        name: 'Original Name',
        acronym: 'ON',
        impactFactor: 2.0,
        status: 'ACTIVE'
      })

      const updateData = {
        name: 'Updated Name',
        impactFactor: 4.5,
        description: 'Updated description'
      }

      const response = await makeRequest('PUT', `/api/v1/journals/${journal.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: journal.id,
        name: updateData.name,
        impactFactor: updateData.impactFactor,
        description: updateData.description,
        acronym: journal.acronym, // Should remain unchanged
        status: journal.status // Should remain unchanged
      })

      // Verify update in database
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedJournal = await prisma.journal.findUnique({
        where: { id: journal.id }
      })
      expect(updatedJournal.name).toBe(updateData.name)
      expect(updatedJournal.impactFactor).toBe(updateData.impactFactor)
    })

    it('should return 404 when updating non-existent journal', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const updateData = { name: 'Updated Name' }

      const response = await makeRequest('PUT', `/api/v1/journals/${fakeId}`, updateData)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
    })

    it('should validate update data with real database', async () => {
      const journal = await createTestJournal()
      const invalidData = { impactFactor: -1.0 }

      const response = await makeRequest('PUT', `/api/v1/journals/${journal.id}`, invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
    })

    it('should handle status transitions with real database', async () => {
      const journal = await createTestJournal({
        name: 'Status Test Journal',
        status: 'ACTIVE'
      })

      // Update to suspended
      const updateData = { status: 'SUSPENDED' }
      const response = await makeRequest('PUT', `/api/v1/journals/${journal.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data.status).toBe('SUSPENDED')

      // Verify status change in database
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedJournal = await prisma.journal.findUnique({
        where: { id: journal.id }
      })
      expect(updatedJournal.status).toBe('SUSPENDED')
    })
  })

  describe('DELETE /api/v1/journals/[id]', () => {
    it('should delete journal with real database removal', async () => {
      // Create journal in database
      const journal = await createTestJournal({
        name: 'To Be Deleted',
        acronym: 'TBD'
      })

      const response = await makeRequest('DELETE', `/api/v1/journals/${journal.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      expect(response.data.message).toContain('deleted')

      // Verify deletion from database
      const { prisma } = require('../../../../src/lib/prisma')
      const deletedJournal = await prisma.journal.findUnique({
        where: { id: journal.id }
      })
      expect(deletedJournal).toBeNull()
    })

    it('should return 404 when deleting non-existent journal', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await makeRequest('DELETE', `/api/v1/journals/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
    })

  })

  describe('Business Logic Tests', () => {
    it('should handle journal lifecycle with real database', async () => {
      // Create journal in active state
      const journalData = {
        name: 'Lifecycle Test Journal',
        acronym: 'LTJ',
        status: 'ACTIVE',
        impactFactor: 3.5
      }

      const response = await makeRequest('POST', '/api/v1/journals', journalData)
      expect(response.status).toBe(201)
      expect(response.data.data.status).toBe('ACTIVE')

      // Update to suspended
      const suspendedUpdate = await makeRequest('PUT', `/api/v1/journals/${response.data.data.id}`, {
        status: 'SUSPENDED'
      })
      expect(suspendedUpdate.status).toBe(200)
      expect(suspendedUpdate.data.data.status).toBe('SUSPENDED')

      // Update back to active
      const activeUpdate = await makeRequest('PUT', `/api/v1/journals/${response.data.data.id}`, {
        status: 'ACTIVE'
      })
      expect(activeUpdate.status).toBe(200)
      expect(activeUpdate.data.data.status).toBe('ACTIVE')
    })


    it('should handle journal with multiple papers', async () => {
      const journal = await createTestJournal({
        name: 'Multi-Paper Journal',
        acronym: 'MPJ'
      })

      const institution = await global.integrationTestUtils.createTestInstitution()
      const author = await global.integrationTestUtils.createTestAuthor({ institutionId: institution.id })
      
      // Create multiple papers for this journal
      const { prisma } = require('../../../../src/lib/prisma')
      for (let i = 1; i <= 3; i++) {
        await prisma.paper.create({
          data: {
            title: `Paper ${i}`,
            abstract: `Abstract for paper ${i}`,
            status: 'PUBLISHED',
            journalId: journal.id,
            authors: {
              create: {
                authorId: author.id,
                isCorresponding: true
              }
            }
          }
        })
      }

      // Verify journal has papers
      const journalWithPapers = await prisma.journal.findUnique({
        where: { id: journal.id },
        include: { papers: true }
      })
      expect(journalWithPapers.papers).toHaveLength(3)
    })
  })

})
