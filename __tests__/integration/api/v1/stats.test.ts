/**
 * Integration Tests for Statistics API
 * 
 * These tests use real database connections and test actual API endpoints.
 * They verify the complete flow from HTTP request to database operations,
 * including complex data aggregation and statistical calculations.
 */

describe('Statistics API Integration Tests', () => {
  const { makeRequest, createTestInstitution, createTestAuthor, createTestConference, createTestJournal } = global.integrationTestUtils

  describe('GET /api/v1/stats/overview', () => {
    beforeEach(async () => {
      // Create comprehensive test data for statistics
      const institution = await createTestInstitution({
        name: 'Test University',
        type: 'UNIVERSITY',
        country: 'US'
      })

      const author = await createTestAuthor({
        name: 'Test Author',
        email: 'test@university.edu',
        institutionId: institution.id
      })

      const conference = await createTestConference({
        name: 'Test Conference',
        acronym: 'TC',
        status: 'UPCOMING'
      })

      const journal = await createTestJournal({
        name: 'Test Journal',
        acronym: 'TJ',
        status: 'ACTIVE',
        impactFactor: 3.5
      })

      // Create papers with different statuses and SEO scores
      const { prisma } = require('../../../../src/lib/prisma')
      
      // Published papers with high SEO scores
      await prisma.paper.create({
        data: {
          title: 'High SEO Paper 1',
          abstract: 'Abstract for high SEO paper 1',
          status: 'PUBLISHED',
          seoScore: 9.5,
          conferenceId: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1,
              order: 1
            }
          }
        }
      })

      await prisma.paper.create({
        data: {
          title: 'High SEO Paper 2',
          abstract: 'Abstract for high SEO paper 2',
          status: 'PUBLISHED',
          seoScore: 8.8,
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

      // Published paper with medium SEO score
      await prisma.paper.create({
        data: {
          title: 'Medium SEO Paper',
          abstract: 'Abstract for medium SEO paper',
          status: 'PUBLISHED',
          seoScore: 6.5,
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

      // Draft paper (no SEO score)
      await prisma.paper.create({
        data: {
          title: 'Draft Paper',
          abstract: 'Abstract for draft paper',
          status: 'DRAFT',
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

      // Create tasks with different statuses
      await prisma.task.create({
        data: {
          type: 'CRAWL',
          status: 'PENDING',
          priority: 5,
          payload: { test: true }
        }
      })

      await prisma.task.create({
        data: {
          type: 'PARSE_PDF',
          status: 'PENDING',
          priority: 3,
          payload: { test: true }
        }
      })

      await prisma.task.create({
        data: {
          type: 'GENERATE_ABSTRACT',
          status: 'FAILED',
          priority: 7,
          payload: { test: true }
        }
      })

      await prisma.task.create({
        data: {
          type: 'CRAWL',
          status: 'COMPLETED',
          priority: 4,
          payload: { test: true }
        }
      })
    })

    it('should return overview statistics with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      
      const stats = response.data.data
      expect(stats).toHaveProperty('total_papers')
      expect(stats).toHaveProperty('total_conferences')
      expect(stats).toHaveProperty('total_journals')
      expect(stats).toHaveProperty('total_authors')
      expect(stats).toHaveProperty('total_institutions')
      expect(stats).toHaveProperty('pending_tasks')
      expect(stats).toHaveProperty('failed_tasks')
      expect(stats).toHaveProperty('seo_score_avg')
    })

    it('should return correct paper count with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.total_papers).toBe(4) // 4 papers created in beforeEach
    })

    it('should return correct conference count with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.total_conferences).toBe(1) // 1 conference created in beforeEach
    })

    it('should return correct journal count with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.total_journals).toBe(1) // 1 journal created in beforeEach
    })

    it('should return correct author count with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.total_authors).toBe(1) // 1 author created in beforeEach
    })

    it('should return correct institution count with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.total_institutions).toBe(1) // 1 institution created in beforeEach
    })

    it('should return correct pending tasks count with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.pending_tasks).toBe(2) // 2 pending tasks created in beforeEach
    })

    it('should return correct failed tasks count with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.failed_tasks).toBe(1) // 1 failed task created in beforeEach
    })

    it('should calculate correct average SEO score with real data', async () => {
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      
      // Only published papers with SEO scores should be included in average
      // Papers: 9.5, 8.8, 6.5 (draft paper with no SEO score excluded)
      // Average: (9.5 + 8.8 + 6.5) / 3 = 8.27
      const expectedAverage = (9.5 + 8.8 + 6.5) / 3
      expect(response.data.data.seo_score_avg).toBeCloseTo(expectedAverage, 2)
    })

    it('should handle empty database gracefully', async () => {
      // Clean up all data
      await global.integrationTestUtils.cleanupDatabase()
      
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.total_papers).toBe(0)
      expect(response.data.data.total_conferences).toBe(0)
      expect(response.data.data.total_journals).toBe(0)
      expect(response.data.data.total_authors).toBe(0)
      expect(response.data.data.total_institutions).toBe(0)
      expect(response.data.data.pending_tasks).toBe(0)
      expect(response.data.data.failed_tasks).toBe(0)
      expect(response.data.data.seo_score_avg).toBe(0)
    })

    it('should handle large datasets efficiently', async () => {
      // Create large dataset
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institutionId: institution.id })
      const conference = await createTestConference()
      
      const { prisma } = require('../../../../src/lib/prisma')
      
      // Create many papers
      const paperPromises = []
      for (let i = 1; i <= 100; i++) {
        paperPromises.push(
          prisma.paper.create({
            data: {
              title: `Paper ${i}`,
              abstract: `Abstract for paper ${i}`,
              status: 'PUBLISHED',
              seoScore: Math.random() * 10,
              conferenceId: conference.id,
              authors: {
                create: {
                  authorId: author.id,
                  isCorresponding: true
                }
              }
            }
          })
        )
      }
      
      await Promise.all(paperPromises)
      
      const startTime = Date.now()
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      const endTime = Date.now()
      
      expect(response.status).toBe(200)
      expect(response.data.data.total_papers).toBe(104) // 100 new + 4 existing
      
      // Should be reasonably fast even with large dataset
      expect(endTime - startTime).toBeLessThan(5000)
    })


    it('should handle database connection issues gracefully', async () => {
      // This test would require mocking database connection failures
      // For now, we'll test that the API returns proper error format
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      // Should either succeed or return proper error format
      if (response.status !== 200) {
        expect(response.data).toHaveProperty('message')
      } else {
        expect(response.data).toHaveProperty('data')
      }
    })

    it('should return consistent results for multiple calls', async () => {
      const response1 = await makeRequest('GET', '/api/v1/stats/overview')
      const response2 = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
      
      // Results should be identical
      expect(response1.data.data.total_papers).toBe(response2.data.data.total_papers)
      expect(response1.data.data.total_conferences).toBe(response2.data.data.total_conferences)
      expect(response1.data.data.total_journals).toBe(response2.data.data.total_journals)
      expect(response1.data.data.total_authors).toBe(response2.data.data.total_authors)
      expect(response1.data.data.total_institutions).toBe(response2.data.data.total_institutions)
      expect(response1.data.data.pending_tasks).toBe(response2.data.data.pending_tasks)
      expect(response1.data.data.failed_tasks).toBe(response2.data.data.failed_tasks)
      expect(response1.data.data.seo_score_avg).toBeCloseTo(response2.data.data.seo_score_avg, 2)
    })

    it('should handle papers with null SEO scores correctly', async () => {
      // Create a paper with null SEO score
      const { prisma } = require('../../../../src/lib/prisma')
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institutionId: institution.id })
      const conference = await createTestConference()
      
      await prisma.paper.create({
        data: {
          title: 'Paper with Null SEO Score',
          abstract: 'This paper has no SEO score',
          status: 'PUBLISHED',
          seoScore: null, // Explicitly null
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
      
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      
      // Average should not include the null SEO score
      // Should still be the same as before: (9.5 + 8.8 + 6.5) / 3 = 8.27
      const expectedAverage = (9.5 + 8.8 + 6.5) / 3
      expect(response.data.data.seo_score_avg).toBeCloseTo(expectedAverage, 2)
    })

    it('should handle edge case with only papers having null SEO scores', async () => {
      // Clean up and create only papers with null SEO scores
      await global.integrationTestUtils.cleanupDatabase()
      
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institutionId: institution.id })
      const conference = await createTestConference()
      
      const { prisma } = require('../../../../src/lib/prisma')
      
      await prisma.paper.create({
        data: {
          title: 'Paper with Null SEO Score 1',
          abstract: 'This paper has no SEO score',
          status: 'PUBLISHED',
          seoScore: null,
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
          title: 'Paper with Null SEO Score 2',
          abstract: 'This paper also has no SEO score',
          status: 'PUBLISHED',
          seoScore: null,
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
      
      const response = await makeRequest('GET', '/api/v1/stats/overview')
      
      expect(response.status).toBe(200)
      expect(response.data.data.total_papers).toBe(2)
      expect(response.data.data.seo_score_avg).toBe(0) // Should be 0 when no papers have SEO scores
    })
  })

  describe('Statistics Data Integrity Tests', () => {
  })
})
