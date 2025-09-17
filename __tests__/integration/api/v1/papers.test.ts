/**
 * Integration Tests for Papers API
 * 
 * These tests use real database connections and test actual API endpoints.
 * They verify the complete flow from HTTP request to database operations,
 * including complex relationships between papers, authors, conferences, and journals.
 */

describe('Papers API Integration Tests', () => {
  const { makeRequest, createTestInstitution, createTestAuthor, createTestConference, createTestJournal } = global.integrationTestUtils

  describe('GET /api/v1/papers', () => {
    it('should return empty list when no papers exist', async () => {
      const response = await makeRequest('GET', '/api/v1/papers')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toEqual([])
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination.total).toBe(0)
    })

    it('should return list of papers with real data and all relations', async () => {
      // Create test data
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      // Create paper with author relation
      const { prisma } = require('../../../../src/lib/prisma')
      const paper = await prisma.paper.create({
        data: {
          title: 'Test Paper Title',
          abstract: 'This is a test paper abstract.',
          doi: '10.1000/test.doi',
          status: 'PUBLISHED',
          seoScore: 8.5,
          conference_id: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      const response = await makeRequest('GET', '/api/v1/papers')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.pagination.total).toBe(1)
      
      // Verify paper data includes all relations
      const paperData = response.data.data[0]
      expect(paperData).toMatchObject({
        id: paper.id,
        title: 'Test Paper Title',
        abstract: 'This is a test paper abstract.',
        doi: '10.1000/test.doi',
        status: 'PUBLISHED',
        seo_score: 8.5
      })
      
      // Verify relations are included
      expect(paperData).toHaveProperty('conference')
      expect(paperData.conference.name).toBe(conference.name)
      expect(paperData).toHaveProperty('authors')
      expect(paperData.authors).toHaveLength(1)
      expect(paperData.authors[0].name).toBe(author.name)
    })

    it('should support pagination with real data', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      // Create multiple papers
      for (let i = 1; i <= 5; i++) {
        await prisma.paper.create({
          data: {
            title: `Paper ${i}`,
            abstract: `Abstract for paper ${i}`,
            status: 'PUBLISHED',
            conference_id: conference.id,
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
      const page1 = await makeRequest('GET', '/api/v1/papers?page=1&limit=2')
      expect(page1.status).toBe(200)
      expect(page1.data.data).toHaveLength(2)
      expect(page1.data.pagination.page).toBe(1)
      expect(page1.data.pagination.total).toBe(5)
    })

    it('should support search functionality with real data', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      await prisma.paper.create({
        data: {
          title: 'Machine Learning in Healthcare',
          abstract: 'This paper discusses ML applications in healthcare.',
          status: 'PUBLISHED',
          conference_id: conference.id,
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
          abstract: 'This paper explores deep learning techniques.',
          status: 'PUBLISHED',
          conference_id: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      // Search for "Machine Learning"
      const response = await makeRequest('GET', '/api/v1/papers?search=Machine Learning')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].title).toBe('Machine Learning in Healthcare')
    })

    it('should support filtering by status with real data', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      await prisma.paper.create({
        data: {
          title: 'Published Paper',
          abstract: 'This paper is published.',
          status: 'PUBLISHED',
          conference_id: conference.id,
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
          title: 'Draft Paper',
          abstract: 'This paper is a draft.',
          status: 'DRAFT',
          conference_id: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      // Filter by published status
      const response = await makeRequest('GET', '/api/v1/papers?status=PUBLISHED')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].status).toBe('PUBLISHED')
    })

    it('should support filtering by conference with real data', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference1 = await createTestConference({ name: 'Conference A' })
      const conference2 = await createTestConference({ name: 'Conference B' })
      
      await prisma.paper.create({
        data: {
          title: 'Paper in Conference A',
          abstract: 'This paper is in conference A.',
          status: 'PUBLISHED',
          conferenceId: conference1.id,
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
          title: 'Paper in Conference B',
          abstract: 'This paper is in conference B.',
          status: 'PUBLISHED',
          conferenceId: conference2.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      // Filter by conference
      const response = await makeRequest('GET', `/api/v1/papers?conferenceId=${conference1.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].conference_id).toBe(conference1.id)
    })
  })

  describe('POST /api/v1/papers', () => {
    it('should create paper with real database persistence and author relations', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const paperData = {
        title: 'Test Paper Title',
        abstract: 'This is a test paper abstract.',
        doi: '10.1000/test.doi',
        arxiv_id: '2401.00001',
        seo_score: 8.5,
        conference_id: conference.id,
        venue: 'Test Venue',
        publication_date: '2024-01-01',
        author_ids: [author.id]
      }

      const response = await makeRequest('POST', '/api/v1/papers', paperData)
      
      expect(response.status).toBe(201)
      expect(response.data.data).toMatchObject({
        title: paperData.title,
        abstract: paperData.abstract,
        doi: paperData.doi,
        venue: paperData.venue
      })
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('created_at')
      expect(response.data.data).toHaveProperty('updated_at')

      // Verify data was actually saved to database with relations
      const { prisma } = require('../../../../src/lib/prisma')
      const savedPaper = await prisma.paper.findUnique({
        where: { id: response.data.data.id },
        include: {
          authors: {
            include: {
              author: {
                include: {
                  institution: true
                }
              }
            }
          },
          conference: true
        }
      })
      expect(savedPaper).toBeTruthy()
      expect(savedPaper.title).toBe(paperData.title)
      expect(savedPaper.authors).toHaveLength(1)
      expect(savedPaper.authors[0].author.name).toBe(author.name)
      expect(savedPaper.conference.name).toBe(conference.name)
    })

    it('should validate required fields with real database', async () => {
      const invalidData = {
        abstract: 'This is a test paper abstract.',
        status: 'PUBLISHED'
        // Missing required 'title' field
      }

      const response = await makeRequest('POST', '/api/v1/papers', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('title')
    })

    it('should validate DOI format with real database', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const invalidData = {
        title: 'Test Paper',
        abstract: 'Test abstract',
        doi: 'invalid-doi',
        status: 'PUBLISHED',
        conference_id: conference.id,
        author_ids: [author.id]
      }

      const response = await makeRequest('POST', '/api/v1/papers', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('DOI')
    })

    it('should validate arXiv ID format with real database', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const invalidData = {
        title: 'Test Paper',
        abstract: 'Test abstract',
        arxiv_id: 'invalid-arxiv',
        status: 'PUBLISHED',
        conference_id: conference.id,
        author_ids: [author.id]
      }

      const response = await makeRequest('POST', '/api/v1/papers', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('arXiv')
    })

    it('should validate SEO score range with real database', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const invalidData = {
        title: 'Test Paper',
        abstract: 'Test abstract',
        status: 'PUBLISHED',
        seo_score: 15, // Invalid: should be 0-10
        conference_id: conference.id,
        author_ids: [author.id]
      }

      const response = await makeRequest('POST', '/api/v1/papers', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
      expect(response.data.error).toContain('SEO score')
    })



  })

  describe('GET /api/v1/papers/[id]', () => {
    it('should return paper by ID with real database lookup and all relations', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const { prisma } = require('../../../../src/lib/prisma')
      const paper = await prisma.paper.create({
        data: {
          title: 'Test Paper Title',
          abstract: 'This is a test paper abstract.',
          doi: '10.1000/test.doi',
          status: 'PUBLISHED',
          seoScore: 8.5,
          conference_id: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      const response = await makeRequest('GET', `/api/v1/papers/${paper.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: paper.id,
        title: paper.title,
        abstract: paper.abstract,
        doi: paper.doi,
        status: paper.status,
        seo_score: paper.seoScore
      })
      expect(response.data.data).toHaveProperty('conference')
      expect(response.data.data.conference.name).toBe(conference.name)
      expect(response.data.data).toHaveProperty('authors')
      expect(response.data.data.authors).toHaveLength(1)
      expect(response.data.data.authors[0].name).toBe(author.name)
    })

    it('should return 404 for non-existent paper', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      
      const response = await makeRequest('GET', `/api/v1/papers/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid'
      
      const response = await makeRequest('GET', `/api/v1/papers/${invalidId}`)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('PUT /api/v1/papers/[id]', () => {
    it('should update paper with real database persistence', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const { prisma } = require('../../../../src/lib/prisma')
      const paper = await prisma.paper.create({
        data: {
          title: 'Original Title',
          abstract: 'Original abstract',
          status: 'DRAFT',
          conference_id: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      const updateData = {
        title: 'Updated Title',
        abstract: 'Updated abstract',
        status: 'PUBLISHED',
        seoScore: 9.0
      }

      const response = await makeRequest('PUT', `/api/v1/papers/${paper.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: paper.id,
        title: updateData.title,
        abstract: updateData.abstract,
        status: updateData.status,
        seoScore: updateData.seoScore
      })

      // Verify update in database
      const updatedPaper = await prisma.paper.findUnique({
        where: { id: paper.id }
      })
      expect(updatedPaper.title).toBe(updateData.title)
      expect(updatedPaper.abstract).toBe(updateData.abstract)
      expect(updatedPaper.status).toBe(updateData.status)
    })

    it('should return 404 when updating non-existent paper', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const updateData = { title: 'Updated Title' }

      const response = await makeRequest('PUT', `/api/v1/papers/${fakeId}`, updateData)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })

    it('should validate update data with real database', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const { prisma } = require('../../../../src/lib/prisma')
      const paper = await prisma.paper.create({
        data: {
          title: 'Test Paper',
          abstract: 'Test abstract',
          status: 'PUBLISHED',
          conference_id: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      const invalidData = { seoScore: 15 } // Invalid: should be 0-10

      const response = await makeRequest('PUT', `/api/v1/papers/${paper.id}`, invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('DELETE /api/v1/papers/[id]', () => {
    it('should delete paper with real database removal and cascade cleanup', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const { prisma } = require('../../../../src/lib/prisma')
      const paper = await prisma.paper.create({
        data: {
          title: 'To Be Deleted',
          abstract: 'This paper will be deleted.',
          status: 'PUBLISHED',
          conference_id: conference.id,
          authors: {
            create: {
              authorId: author.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      const response = await makeRequest('DELETE', `/api/v1/papers/${paper.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      expect(response.data.message).toContain('deleted')

      // Verify deletion from database
      const deletedPaper = await prisma.paper.findUnique({
        where: { id: paper.id }
      })
      expect(deletedPaper).toBeNull()

      // Verify cascade deletion of paper-author relations
      const paperAuthorRelations = await prisma.paperAuthor.findMany({
        where: { paperId: paper.id }
      })
      expect(paperAuthorRelations).toHaveLength(0)
    })

    it('should return 404 when deleting non-existent paper', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await makeRequest('DELETE', `/api/v1/papers/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('error')
    })
  })

  describe('Complex Relationship Tests', () => {
    it('should handle paper with multiple authors', async () => {
      const institution = await createTestInstitution()
      const author1 = await createTestAuthor({ 
        name: 'First Author',
        institution_id: institution.id 
      })
      const author2 = await createTestAuthor({ 
        name: 'Second Author',
        institution_id: institution.id 
      })
      const conference = await createTestConference()
      
      const paperData = {
        title: 'Multi-Author Paper',
        abstract: 'This paper has multiple authors.',
        status: 'PUBLISHED',
        conference_id: conference.id,
        authors: [
          {
            authorId: author1.id,
            isCorresponding: true
          },
          {
            authorId: author2.id,
            isCorresponding: false
          }
        ]
      }

      const response = await makeRequest('POST', '/api/v1/papers', paperData)
      
      expect(response.status).toBe(201)
      expect(response.data.data.authors).toHaveLength(2)
      
      // Verify in database
      const { prisma } = require('../../../../src/lib/prisma')
      const savedPaper = await prisma.paper.findUnique({
        where: { id: response.data.data.id },
        include: {
          authors: {
            include: {
              author: true
            }
          }
        }
      })
      expect(savedPaper.authors).toHaveLength(2)
      
      const correspondingAuthor = savedPaper.authors.find(pa => pa.isCorresponding)
      expect(correspondingAuthor.author.name).toBe('First Author')
    })

    it('should handle paper with journal instead of conference', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const journal = await createTestJournal()
      
      const paperData = {
        title: 'Journal Paper',
        abstract: 'This paper is published in a journal.',
        status: 'PUBLISHED',
        journalId: journal.id,
        authors: [
          {
            authorId: author.id,
            isCorresponding: true
          }
        ]
      }

      const response = await makeRequest('POST', '/api/v1/papers', paperData)
      
      expect(response.status).toBe(201)
      expect(response.data.data.journalId).toBe(journal.id)
      expect(response.data.data.conference_id).toBeNull()
      
      // Verify in database
      const { prisma } = require('../../../../src/lib/prisma')
      const savedPaper = await prisma.paper.findUnique({
        where: { id: response.data.data.id },
        include: {
          journal: true
        }
      })
      expect(savedPaper.journal.name).toBe(journal.name)
    })
  })

  describe('Database Transaction Tests', () => {
    it('should handle concurrent paper creation requests', async () => {
      const institution = await createTestInstitution()
      const author = await createTestAuthor({ institution_id: institution.id })
      const conference = await createTestConference()
      
      const paperData = {
        title: 'Concurrent Test Paper',
        abstract: 'This paper tests concurrent creation.',
        doi: '10.1000/concurrent.doi',
        status: 'PUBLISHED',
        conference_id: conference.id,
        authors: [{ authorId: author.id, isCorresponding: true, order: 1 }]
      }

      // Create multiple concurrent requests with same DOI
      const promises = Array(3).fill(null).map(() => 
        makeRequest('POST', '/api/v1/papers', paperData)
      )

      const responses = await Promise.all(promises)
      
      // Only one should succeed (201), others should fail (400)
      const successCount = responses.filter(r => r.status === 201).length
      const errorCount = responses.filter(r => r.status === 400).length
      
      expect(successCount).toBe(1)
      expect(errorCount).toBe(2)
    })

    it('should maintain data consistency during complex updates', async () => {
      const institution = await createTestInstitution()
      const author1 = await createTestAuthor({ 
        name: 'Author 1',
        institution_id: institution.id 
      })
      const author2 = await createTestAuthor({ 
        name: 'Author 2',
        institution_id: institution.id 
      })
      const conference = await createTestConference()
      
      const { prisma } = require('../../../../src/lib/prisma')
      const paper = await prisma.paper.create({
        data: {
          title: 'Consistency Test Paper',
          abstract: 'Test abstract',
          status: 'PUBLISHED',
          conference_id: conference.id,
          authors: {
            create: {
              authorId: author1.id,
              isCorresponding: true,
              order: 1
            }
          }
        }
      })

      // Concurrent updates
      const update1 = makeRequest('PUT', `/api/v1/papers/${paper.id}`, {
        title: 'Updated Title 1',
        seoScore: 8.0
      })
      const update2 = makeRequest('PUT', `/api/v1/papers/${paper.id}`, {
        title: 'Updated Title 2',
        seoScore: 9.0
      })

      const [response1, response2] = await Promise.all([update1, update2])
      
      // Both should succeed (database handles concurrency)
      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)

      // Verify final state in database
      const finalPaper = await prisma.paper.findUnique({
        where: { id: paper.id }
      })
      expect(finalPaper).toBeTruthy()
      expect(['Updated Title 1', 'Updated Title 2']).toContain(finalPaper.title)
    })
  })
})
