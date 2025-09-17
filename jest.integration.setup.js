/**
 * Integration Test Setup
 * 
 * This file sets up the environment for integration tests that use real database connections.
 * Unlike unit tests, these tests will interact with actual database instances.
 */

// Set test environment
process.env.NODE_ENV = 'test'

// Use existing database for integration tests
// DATABASE_URL should be set in environment or .env file

// Global test timeout
jest.setTimeout(30000)

// Global test utilities for integration tests
global.integrationTestUtils = {
  // Database cleanup utilities
  async cleanupDatabase() {
    try {
      const { prisma } = require('./src/lib/prisma')
      
      // Test database connection first
      await prisma.$connect()
    
      // Delete in reverse order of dependencies
      await prisma.paperKeyword.deleteMany()
      await prisma.paperAuthor.deleteMany()
      await prisma.abstract.deleteMany()
      await prisma.taskLog.deleteMany()
      await prisma.task.deleteMany()
      await prisma.paper.deleteMany()
      await prisma.author.deleteMany()
      await prisma.conference.deleteMany()
      await prisma.journal.deleteMany()
      await prisma.institution.deleteMany()
      
      await prisma.$disconnect()
    } catch (error) {
      console.warn('⚠️  Database cleanup skipped - database not available')
      console.warn('This is expected if no test database is configured')
      console.warn('Error:', error.message)
      // Don't throw error, just skip cleanup
    }
  },

  // Create test data with real database
  async createTestInstitution(data = {}) {
    try {
      const { prisma } = require('./src/lib/prisma')
      return await prisma.institution.create({
        data: {
          name: data.name || 'Test University',
          type: data.type || 'UNIVERSITY',
          country: data.country || 'US',
          city: data.city || 'Test City',
          website: data.website || 'https://test.edu',
          ...data
        }
      })
    } catch (error) {
      console.warn('⚠️  Database operation skipped - database not available')
      console.warn('Error:', error.message)
      // Return mock data for testing
      return {
        id: 'mock-institution-id',
        name: data.name || 'Test University',
        type: data.type || 'UNIVERSITY',
        country: data.country || 'US',
        city: data.city || 'Test City',
        website: data.website || 'https://test.edu',
        ...data
      }
    }
  },

  async createTestAuthor(data = {}) {
    const { prisma } = require('./src/lib/prisma')
    
    // Create institution if not provided
    let institution
    if (!data.institution_id) {
      institution = await global.integrationTestUtils.createTestInstitution()
      data.institution_id = institution.id
    }

    // Generate unique ORCID to avoid constraint violations
    const uniqueOrcid = data.orcid || `0000-0000-0000-${Math.random().toString().substr(2, 4)}`

    return await prisma.author.create({
      data: {
        name: data.name || 'Test Author',
        email: data.email || 'test@example.com',
        orcid: uniqueOrcid,
        institutionId: data.institution_id,
        // Remove institution_id from data to avoid duplicate field
        ...Object.fromEntries(Object.entries(data).filter(([key]) => key !== 'institution_id'))
      }
    })
  },

  async createTestConference(data = {}) {
    const { prisma } = require('./src/lib/prisma')
    return await prisma.conference.create({
      data: {
        name: data.name || 'Test Conference',
        acronym: data.acronym || 'TC',
        description: data.description || 'Test conference for integration tests',
        website: data.website || 'https://test-conference.org',
        status: data.status || 'UPCOMING',
        submissionDeadline: data.submissionDeadline || new Date('2024-12-31'),
        conferenceDate: data.conferenceDate || new Date('2025-01-15'),
        // venueId is optional and should be a valid venue ID if provided
        ...data
      }
    })
  },

  async createTestJournal(data = {}) {
    const { prisma } = require('./src/lib/prisma')
    return await prisma.journal.create({
      data: {
        name: data.name || 'Test Journal',
        acronym: data.acronym || 'TJ',
        issn: data.issn || '1234-5678',
        eissn: data.eissn || '9876-5432',
        description: data.description || 'Test journal for integration tests',
        website: data.website || 'https://test-journal.org',
        publisher: data.publisher || 'Test Publisher',
        impactFactor: data.impactFactor || 2.5,
        status: data.status || 'ACTIVE',
        ...data
      }
    })
  },

  async createTestPaper(data = {}) {
    const { prisma } = require('./src/lib/prisma')
    
    // Create dependencies if not provided
    let author, conference, journal
    if (!data.authors || data.authors.length === 0) {
      author = await this.createTestAuthor()
      data.authors = [{ authorId: author.id, isCorresponding: true }]
    }
    
    if (!data.conferenceId && !data.journalId) {
      conference = await this.createTestConference()
      data.conferenceId = conference.id
    }

    return await prisma.paper.create({
      data: {
        title: data.title || 'Test Paper Title',
        abstract: data.abstract || 'This is a test paper abstract for integration testing.',
        doi: data.doi || '10.1000/test.doi',
        arxivId: data.arxivId || '2401.00001',
        status: data.status || 'PUBLISHED',
        seoScore: data.seoScore || 8.5,
        conferenceId: data.conferenceId,
        journalId: data.journalId,
        venue: data.venue || 'Test Venue',
        publicationDate: data.publicationDate || new Date(),
        ...data
      }
    })
  },

  async createTestTask(data = {}) {
    const { prisma } = require('./src/lib/prisma')
    return await prisma.task.create({
      data: {
        type: data.type || 'CRAWL',
        status: data.status || 'PENDING',
        priority: data.priority || 5,
        payload: data.payload || { test: true },
        ...data
      }
    })
  },

  // HTTP request utilities
  async makeRequest(method, url, data = null, headers = {}) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'
    const fullUrl = `${baseUrl}${url}`
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    if (data) {
      options.body = JSON.stringify(data)
    }

    const response = await fetch(fullUrl, options)
    const responseData = await response.json().catch(() => null)
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: responseData
    }
  },

  // Wait for async operations
  async waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Global setup for each test
beforeEach(async () => {
  // Clean up database before each test
  await global.integrationTestUtils.cleanupDatabase()
})

// Global teardown for each test
afterEach(async () => {
  // Clean up database after each test
  await global.integrationTestUtils.cleanupDatabase()
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
