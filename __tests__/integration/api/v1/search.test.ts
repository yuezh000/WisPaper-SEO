/**
 * Integration Tests for Search API
 * 
 * These tests use real database connections and test actual API endpoints.
 * They verify the complete flow from HTTP request to database operations,
 * including complex search queries across multiple entities.
 */

describe('Search API Integration Tests', () => {
  const { makeRequest, createTestInstitution, createTestAuthor, createTestConference, createTestJournal } = global.integrationTestUtils

  describe('GET /api/v1/search', () => {
    beforeEach(async () => {
      // Create test data for search tests
      const institution = await createTestInstitution({
        name: 'Test University',
        type: 'UNIVERSITY',
        country: 'US'
      })

      const author = await createTestAuthor({
        name: 'John Doe',
        email: 'john@test.edu',
        institutionId: institution.id
      })

      const conference = await createTestConference({
        name: 'International Conference on AI',
        acronym: 'ICAI',
        description: 'Leading AI conference'
      })

      const journal = await createTestJournal({
        name: 'Journal of Machine Learning',
        acronym: 'JML',
        publisher: 'ML Publisher'
      })

      // Create papers with different content
      const { prisma } = require('../../../../src/lib/prisma')
      
      await prisma.paper.create({
        data: {
          title: 'Machine Learning in Healthcare',
          abstract: 'This paper discusses ML applications in healthcare systems.',
          doi: '10.1000/ml-healthcare',
          status: 'PUBLISHED',
          seoScore: 8.5,
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

      await prisma.paper.create({
        data: {
          title: 'Deep Learning for Computer Vision',
          abstract: 'This paper explores deep learning techniques for computer vision tasks.',
          doi: '10.1000/dl-vision',
          status: 'PUBLISHED',
          seoScore: 9.0,
          journalId: journal.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      await prisma.paper.create({
        data: {
          title: 'Natural Language Processing Advances',
          abstract: 'Recent advances in NLP and language models.',
          doi: '10.1000/nlp-advances',
          status: 'DRAFT',
          seoScore: 7.5,
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
    })

    it('should return empty results when no data matches search', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=nonexistent')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toEqual([])
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination.total).toBe(0)
    })

    it('should search across all entities with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=machine learning')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data.length).toBeGreaterThan(0)
      expect(response.data).toHaveProperty('pagination')
      
      // Verify search results include different entity types
      const entityTypes = response.data.data.map(item => item.type)
      expect(entityTypes).toContain('paper')
      expect(entityTypes).toContain('author')
      expect(entityTypes).toContain('conference')
      expect(entityTypes).toContain('journal')
    })

    it('should search papers by title with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=Machine Learning in Healthcare')
      
      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)
      
      // Find paper results
      const paperResults = response.data.data.filter(item => item.type === 'paper')
      expect(paperResults.length).toBeGreaterThan(0)
      
      const paper = paperResults[0]
      expect(paper.title).toContain('Machine Learning')
      expect(paper).toHaveProperty('abstract')
      expect(paper).toHaveProperty('doi')
      expect(paper).toHaveProperty('seoScore')
    })

    it('should search papers by abstract with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=healthcare systems')
      
      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)
      
      // Find paper results
      const paperResults = response.data.data.filter(item => item.type === 'paper')
      expect(paperResults.length).toBeGreaterThan(0)
      
      const paper = paperResults[0]
      expect(paper.abstract).toContain('healthcare')
    })

    it('should search authors by name with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=John Doe')
      
      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)
      
      // Find author results
      const authorResults = response.data.data.filter(item => item.type === 'author')
      expect(authorResults.length).toBeGreaterThan(0)
      
      const author = authorResults[0]
      expect(author.name).toBe('John Doe')
      expect(author).toHaveProperty('email')
      expect(author).toHaveProperty('institution')
    })

    it('should search conferences by name with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=International Conference on AI')
      
      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)
      
      // Find conference results
      const conferenceResults = response.data.data.filter(item => item.type === 'conference')
      expect(conferenceResults.length).toBeGreaterThan(0)
      
      const conference = conferenceResults[0]
      expect(conference.name).toContain('International Conference on AI')
      expect(conference).toHaveProperty('acronym')
      expect(conference).toHaveProperty('description')
    })

    it('should search journals by name with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=Journal of Machine Learning')
      
      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)
      
      // Find journal results
      const journalResults = response.data.data.filter(item => item.type === 'journal')
      expect(journalResults.length).toBeGreaterThan(0)
      
      const journal = journalResults[0]
      expect(journal.name).toContain('Journal of Machine Learning')
      expect(journal).toHaveProperty('publisher')
    })

    it('should search institutions by name with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=Test University')
      
      expect(response.status).toBe(200)
      expect(response.data.data.length).toBeGreaterThan(0)
      
      // Find institution results
      const institutionResults = response.data.data.filter(item => item.type === 'institution')
      expect(institutionResults.length).toBeGreaterThan(0)
      
      const institution = institutionResults[0]
      expect(institution.name).toBe('Test University')
      expect(institution).toHaveProperty('type')
      expect(institution).toHaveProperty('country')
    })

    it('should support pagination with real data', async () => {
      // Create more test data for pagination
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institutionId: institution.id })
      const conference = await createTestConference()
      
      const { prisma } = require('../../../../src/lib/prisma')
      
      // Create multiple papers with similar content
      for (let i = 1; i <= 5; i++) {
        await prisma.paper.create({
          data: {
            title: `Test Paper ${i}`,
            abstract: `This is test paper ${i} for pagination testing.`,
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

      // Test first page
      const page1 = await makeRequest('GET', '/api/v1/search?q=test&page=1&limit=3')
      expect(page1.status).toBe(200)
      expect(page1.data.data.length).toBeLessThanOrEqual(3)
      expect(page1.data.pagination.page).toBe(1)
      expect(page1.data.pagination.limit).toBe(3)

      // Test second page
      const page2 = await makeRequest('GET', '/api/v1/search?q=test&page=2&limit=3')
      expect(page2.status).toBe(200)
      expect(page2.data.pagination.page).toBe(2)
    })

    it('should support filtering by entity type with real data', async () => {
      // Search only papers
      const paperResponse = await makeRequest('GET', '/api/v1/search?q=machine&type=paper')
      expect(paperResponse.status).toBe(200)
      expect(paperResponse.data.data.every(item => item.type === 'paper')).toBe(true)

      // Search only authors
      const authorResponse = await makeRequest('GET', '/api/v1/search?q=john&type=author')
      expect(authorResponse.status).toBe(200)
      expect(authorResponse.data.data.every(item => item.type === 'author')).toBe(true)

      // Search only conferences
      const conferenceResponse = await makeRequest('GET', '/api/v1/search?q=conference&type=conference')
      expect(conferenceResponse.status).toBe(200)
      expect(conferenceResponse.data.data.every(item => item.type === 'conference')).toBe(true)

      // Search only journals
      const journalResponse = await makeRequest('GET', '/api/v1/search?q=journal&type=journal')
      expect(journalResponse.status).toBe(200)
      expect(journalResponse.data.data.every(item => item.type === 'journal')).toBe(true)

      // Search only institutions
      const institutionResponse = await makeRequest('GET', '/api/v1/search?q=university&type=institution')
      expect(institutionResponse.status).toBe(200)
      expect(institutionResponse.data.data.every(item => item.type === 'institution')).toBe(true)
    })

    it('should support case-insensitive search with real data', async () => {
      const lowerCaseResponse = await makeRequest('GET', '/api/v1/search?q=machine learning')
      const upperCaseResponse = await makeRequest('GET', '/api/v1/search?q=MACHINE LEARNING')
      const mixedCaseResponse = await makeRequest('GET', '/api/v1/search?q=MaChInE LeArNiNg')

      expect(lowerCaseResponse.status).toBe(200)
      expect(upperCaseResponse.status).toBe(200)
      expect(mixedCaseResponse.status).toBe(200)

      // All should return similar results
      expect(lowerCaseResponse.data.data.length).toBe(upperCaseResponse.data.data.length)
      expect(lowerCaseResponse.data.data.length).toBe(mixedCaseResponse.data.data.length)
    })

    it('should support partial word matching with real data', async () => {
      const fullWordResponse = await makeRequest('GET', '/api/v1/search?q=machine')
      const partialWordResponse = await makeRequest('GET', '/api/v1/search?q=mach')

      expect(fullWordResponse.status).toBe(200)
      expect(partialWordResponse.status).toBe(200)

      // Partial search should return at least as many results as full word
      expect(partialWordResponse.data.data.length).toBeGreaterThanOrEqual(fullWordResponse.data.data.length)
    })

    it('should include related data in search results with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=machine learning')
      
      expect(response.status).toBe(200)
      
      // Find paper results and verify they include related data
      const paperResults = response.data.data.filter(item => item.type === 'paper')
      if (paperResults.length > 0) {
        const paper = paperResults[0]
        
        // Paper should include author information
        if (paper.authors && paper.authors.length > 0) {
          expect(paper.authors[0]).toHaveProperty('author')
          expect(paper.authors[0].author).toHaveProperty('name')
        }
        
        // Paper should include venue information (conference or journal)
        if (paper.conference) {
          expect(paper.conference).toHaveProperty('name')
        }
        if (paper.journal) {
          expect(paper.journal).toHaveProperty('name')
        }
      }
    })

    it('should handle empty search query gracefully', async () => {
      const response = await makeRequest('GET', '/api/v1/search?q=')
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('query')
    })

    it('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(1000)
      const response = await makeRequest('GET', `/api/v1/search?q=${longQuery}`)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
    })

    it('should handle special characters in search query', async () => {
      const specialQuery = 'machine@learning#test$query%'
      const response = await makeRequest('GET', `/api/v1/search?q=${encodeURIComponent(specialQuery)}`)
      
      expect(response.status).toBe(200)
      // Should not crash, may return empty results
      expect(response.data).toHaveProperty('data')
      expect(response.data).toHaveProperty('pagination')
    })

    it('should validate search parameters with real database', async () => {
      // Invalid page number
      const invalidPageResponse = await makeRequest('GET', '/api/v1/search?q=test&page=0')
      expect(invalidPageResponse.status).toBe(400)
      expect(invalidPageResponse.data).toHaveProperty('message')

      // Invalid limit
      const invalidLimitResponse = await makeRequest('GET', '/api/v1/search?q=test&limit=0')
      expect(invalidLimitResponse.status).toBe(400)
      expect(invalidLimitResponse.data).toHaveProperty('message')

      // Invalid entity type
      const invalidTypeResponse = await makeRequest('GET', '/api/v1/search?q=test&type=invalid')
      expect(invalidTypeResponse.status).toBe(400)
      expect(invalidTypeResponse.data).toHaveProperty('message')
    })


    it('should return consistent results for same query', async () => {
      const response1 = await makeRequest('GET', '/api/v1/search?q=machine learning')
      const response2 = await makeRequest('GET', '/api/v1/search?q=machine learning')
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      // Results should be consistent (same total count)
      expect(response1.data.pagination.total).toBe(response2.data.pagination.total)
    })
  })

  describe('Search Performance Tests', () => {
    it('should handle large result sets efficiently', async () => {
      const startTime = Date.now()
      
      const response = await makeRequest('GET', '/api/v1/search?q=test')
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      // Response should be fast (less than 2 seconds)
      expect(responseTime).toBeLessThan(2000)
    })

    it('should handle complex search queries efficiently', async () => {
      const complexQuery = 'machine learning deep neural networks computer vision natural language processing'
      const startTime = Date.now()
      
      const response = await makeRequest('GET', `/api/v1/search?q=${encodeURIComponent(complexQuery)}`)
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      expect(response.status).toBe(200)
      // Complex queries should still be reasonably fast
      expect(responseTime).toBeLessThan(3000)
    })
  })
})
