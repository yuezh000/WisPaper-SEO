/**
 * Integration Tests for Tasks API
 * 
 * These tests use real database connections and test actual API endpoints.
 * They verify the complete flow from HTTP request to database operations.
 */

describe('Tasks API Integration Tests', () => {
  const { makeRequest, createTestTask } = global.integrationTestUtils

  describe('GET /api/v1/tasks', () => {
    it('should return empty list when no tasks exist', async () => {
      const response = await makeRequest('GET', '/api/v1/tasks')
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('data')
      expect(response.data.data).toEqual([])
      expect(response.data).toHaveProperty('pagination')
      expect(response.data.pagination.total).toBe(0)
    })

    it('should return list of tasks with real data', async () => {
      // Create test tasks in database
      const task1 = await createTestTask({
        type: 'CRAWL',
        status: 'PENDING',
        priority: 5,
        payload: { test: 'data1' }
      })
      
      const task2 = await createTestTask({
        type: 'PARSE_PDF',
        status: 'RUNNING',
        priority: 3,
        payload: { test: 'data2' }
      })

      const response = await makeRequest('GET', '/api/v1/tasks')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(2)
      expect(response.data.pagination.total).toBe(2)
      
      // Verify task data
      const taskTypes = response.data.data.map(task => task.type)
      expect(taskTypes).toContain('CRAWL')
      expect(taskTypes).toContain('PARSE_PDF')
    })

    it('should support pagination with real data', async () => {
      // Create multiple tasks
      for (let i = 1; i <= 5; i++) {
        await createTestTask({
          type: 'CRAWL',
          status: 'PENDING',
          priority: i,
          payload: { test: `data${i}` }
        })
      }

      // Test first page
      const page1 = await makeRequest('GET', '/api/v1/tasks?page=1&limit=2')
      expect(page1.status).toBe(200)
      expect(page1.data.data).toHaveLength(2)
      expect(page1.data.pagination.page).toBe(1)
      expect(page1.data.pagination.limit).toBe(2)
      expect(page1.data.pagination.total).toBe(5)

      // Test second page
      const page2 = await makeRequest('GET', '/api/v1/tasks?page=2&limit=2')
      expect(page2.status).toBe(200)
      expect(page2.data.data).toHaveLength(2)
      expect(page2.data.pagination.page).toBe(2)
    })

    it('should support filtering by type with real data', async () => {
      // Create tasks with different types
      await createTestTask({ 
        type: 'CRAWL',
        status: 'PENDING'
      })
      await createTestTask({ 
        type: 'PARSE_PDF',
        status: 'PENDING'
      })
      await createTestTask({ 
        type: 'GENERATE_ABSTRACT',
        status: 'PENDING'
      })

      // Filter by type
      const response = await makeRequest('GET', '/api/v1/tasks?type=CRAWL')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].type).toBe('CRAWL')
    })

    it('should support filtering by status with real data', async () => {
      // Create tasks with different statuses
      await createTestTask({ 
        type: 'CRAWL',
        status: 'PENDING'
      })
      await createTestTask({ 
        type: 'PARSE_PDF',
        status: 'RUNNING'
      })
      await createTestTask({ 
        type: 'GENERATE_ABSTRACT',
        status: 'COMPLETED'
      })

      // Filter by status
      const response = await makeRequest('GET', '/api/v1/tasks?status=PENDING')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(1)
      expect(response.data.data[0].status).toBe('PENDING')
    })

    it('should support filtering by priority with real data', async () => {
      // Create tasks with different priorities
      await createTestTask({ 
        type: 'CRAWL',
        priority: 1
      })
      await createTestTask({ 
        type: 'PARSE_PDF',
        priority: 5
      })
      await createTestTask({ 
        type: 'GENERATE_ABSTRACT',
        priority: 10
      })

      // Filter by minimum priority
      const response = await makeRequest('GET', '/api/v1/tasks?minPriority=5')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(2)
      expect(response.data.data.every(task => task.priority >= 5)).toBe(true)
    })

    it('should support sorting by priority with real data', async () => {
      // Create tasks with different priorities
      await createTestTask({ 
        type: 'CRAWL',
        priority: 3
      })
      await createTestTask({ 
        type: 'PARSE_PDF',
        priority: 1
      })
      await createTestTask({ 
        type: 'GENERATE_ABSTRACT',
        priority: 5
      })

      // Sort by priority descending
      const response = await makeRequest('GET', '/api/v1/tasks?sortBy=priority&sortOrder=desc')
      
      expect(response.status).toBe(200)
      expect(response.data.data).toHaveLength(3)
      
      // Verify sorting order
      const priorities = response.data.data.map(task => task.priority)
      expect(priorities).toEqual([5, 3, 1])
    })
  })

  describe('POST /api/v1/tasks', () => {
    it('should create task with real database persistence', async () => {
      const taskData = {
        type: 'CRAWL',
        priority: 5,
        payload: {
          paperId: 'test-paper-id',
          analysisType: 'comprehensive'
        }
      }

      const response = await makeRequest('POST', '/api/v1/tasks', taskData)
      
      expect(response.status).toBe(201)
      expect(response.data.data).toMatchObject({
        type: taskData.type,
        priority: taskData.priority,
        payload: taskData.payload,
        status: 'PENDING' // Default status
      })
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('created_at')
      expect(response.data.data).toHaveProperty('updated_at')

      // Verify data was actually saved to database
      const { prisma } = require('../../../../src/lib/prisma')
      const savedTask = await prisma.task.findUnique({
        where: { id: response.data.data.id }
      })
      expect(savedTask).toBeTruthy()
      expect(savedTask.type).toBe(taskData.type)
      expect(savedTask.priority).toBe(taskData.priority)
    })

    it('should validate required fields with real database', async () => {
      const invalidData = {
        priority: 5,
        payload: { test: true }
        // Missing required 'type' field
      }

      const response = await makeRequest('POST', '/api/v1/tasks', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('type')
    })


    it('should validate priority range with real database', async () => {
      const invalidData = {
        type: 'CRAWL',
        priority: 15, // Invalid: should be 1-10
        payload: { test: true }
      }

      const response = await makeRequest('POST', '/api/v1/tasks', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('priority')
    })

    it('should validate payload JSON format with real database', async () => {
      const invalidData = {
        type: 'CRAWL',
        priority: 5,
        payload: 'invalid-json-string'
      }

      const response = await makeRequest('POST', '/api/v1/tasks', invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
      expect(response.data.error).toContain('payload')
    })

    it('should handle complex payload data with real database', async () => {
      const complexPayload = {
        paperId: 'test-paper-id',
        analysisType: 'comprehensive',
        options: {
          includeKeywords: true,
          includeCompetitors: false,
          depth: 'deep'
        },
        metadata: {
          source: 'api',
          version: '1.0'
        }
      }

      const taskData = {
        type: 'CRAWL',
        priority: 7,
        payload: complexPayload
      }

      const response = await makeRequest('POST', '/api/v1/tasks', taskData)
      
      expect(response.status).toBe(201)
      expect(response.data.data.payload).toEqual(complexPayload)

      // Verify complex payload in database
      const { prisma } = require('../../../../src/lib/prisma')
      const savedTask = await prisma.task.findUnique({
        where: { id: response.data.data.id }
      })
      expect(savedTask.payload).toEqual(complexPayload)
    })
  })

  describe('GET /api/v1/tasks/[id]', () => {
    it('should return task by ID with real database lookup', async () => {
      // Create task in database
      const task = await createTestTask({
        type: 'CRAWL',
        status: 'PENDING',
        priority: 5,
        payload: { test: 'data' }
      })

      const response = await makeRequest('GET', `/api/v1/tasks/${task.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: task.id,
        type: task.type,
        status: task.status,
        priority: task.priority,
        payload: task.payload
      })
    })

    it('should return 404 for non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      
      const response = await makeRequest('GET', `/api/v1/tasks/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
    })

    it('should return 400 for invalid UUID format', async () => {
      const invalidId = 'invalid-uuid'
      
      const response = await makeRequest('GET', `/api/v1/tasks/${invalidId}`)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
    })
  })

  describe('PUT /api/v1/tasks/[id]', () => {
    it('should update task with real database persistence', async () => {
      // Create task in database
      const task = await createTestTask({
        type: 'CRAWL',
        status: 'PENDING',
        priority: 5,
        payload: { test: 'original' }
      })

      const updateData = {
        status: 'RUNNING',
        priority: 7,
        payload: { test: 'updated' }
      }

      const response = await makeRequest('PUT', `/api/v1/tasks/${task.id}`, updateData)
      
      expect(response.status).toBe(200)
      expect(response.data.data).toMatchObject({
        id: task.id,
        status: updateData.status,
        priority: updateData.priority,
        payload: updateData.payload,
        type: task.type // Should remain unchanged
      })

      // Verify update in database
      const { prisma } = require('../../../../src/lib/prisma')
      const updatedTask = await prisma.task.findUnique({
        where: { id: task.id }
      })
      expect(updatedTask.status).toBe(updateData.status)
      expect(updatedTask.priority).toBe(updateData.priority)
    })

    it('should return 404 when updating non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const updateData = { status: 'RUNNING' }

      const response = await makeRequest('PUT', `/api/v1/tasks/${fakeId}`, updateData)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
    })

    it('should validate update data with real database', async () => {
      const task = await createTestTask()
      const invalidData = { priority: 15 } // Invalid: should be 1-10

      const response = await makeRequest('PUT', `/api/v1/tasks/${task.id}`, invalidData)
      
      expect(response.status).toBe(400)
      expect(response.data).toHaveProperty('message')
    })

    it('should handle status transitions with real database', async () => {
      const task = await createTestTask({
        type: 'CRAWL',
        status: 'PENDING',
        priority: 5
      })

      // Update to running
      const runningUpdate = await makeRequest('PUT', `/api/v1/tasks/${task.id}`, {
        status: 'RUNNING'
      })
      expect(runningUpdate.status).toBe(200)
      expect(runningUpdate.data.data.status).toBe('RUNNING')

      // Update to completed
      const completedUpdate = await makeRequest('PUT', `/api/v1/tasks/${task.id}`, {
        status: 'COMPLETED'
      })
      expect(completedUpdate.status).toBe(200)
      expect(completedUpdate.data.data.status).toBe('COMPLETED')

      // Verify status transitions in database
      const { prisma } = require('../../../../src/lib/prisma')
      const finalTask = await prisma.task.findUnique({
        where: { id: task.id }
      })
      expect(finalTask.status).toBe('COMPLETED')
    })
  })

  describe('DELETE /api/v1/tasks/[id]', () => {
    it('should delete task with real database removal', async () => {
      // Create task in database
      const task = await createTestTask({
        type: 'CRAWL',
        status: 'PENDING',
        priority: 5
      })

      const response = await makeRequest('DELETE', `/api/v1/tasks/${task.id}`)
      
      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('message')
      expect(response.data.message).toContain('deleted')

      // Verify deletion from database
      const { prisma } = require('../../../../src/lib/prisma')
      const deletedTask = await prisma.task.findUnique({
        where: { id: task.id }
      })
      expect(deletedTask).toBeNull()
    })

    it('should return 404 when deleting non-existent task', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await makeRequest('DELETE', `/api/v1/tasks/${fakeId}`)
      
      expect(response.status).toBe(404)
      expect(response.data).toHaveProperty('message')
    })

  })

  describe('Task Lifecycle Tests', () => {
    it('should handle complete task lifecycle with real database', async () => {
      // Create task
      const taskData = {
        type: 'CRAWL',
        priority: 5,
        payload: { paperId: 'test-paper' }
      }

      const createResponse = await makeRequest('POST', '/api/v1/tasks', taskData)
      expect(createResponse.status).toBe(201)
      const taskId = createResponse.data.data.id

      // Start task
      const startResponse = await makeRequest('PUT', `/api/v1/tasks/${taskId}`, {
        status: 'RUNNING'
      })
      expect(startResponse.status).toBe(200)
      expect(startResponse.data.data.status).toBe('RUNNING')

      // Complete task
      const completeResponse = await makeRequest('PUT', `/api/v1/tasks/${taskId}`, {
        status: 'COMPLETED',
        payload: { 
          paperId: 'test-paper',
          result: 'Analysis completed successfully',
          seoScore: 8.5
        }
      })
      expect(completeResponse.status).toBe(200)
      expect(completeResponse.data.data.status).toBe('COMPLETED')

      // Verify final state in database
      const { prisma } = require('../../../../src/lib/prisma')
      const finalTask = await prisma.task.findUnique({
        where: { id: taskId }
      })
      expect(finalTask.status).toBe('COMPLETED')
      expect(finalTask.payload.result).toBe('Analysis completed successfully')
    })

    it('should handle task failure with real database', async () => {
      const task = await createTestTask({
        type: 'CRAWL',
        status: 'RUNNING',
        priority: 5
      })

      // Fail task
      const failResponse = await makeRequest('PUT', `/api/v1/tasks/${task.id}`, {
        status: 'FAILED',
        payload: {
          error: 'Analysis failed due to invalid input',
          retryCount: 3
        }
      })
      expect(failResponse.status).toBe(200)
      expect(failResponse.data.data.status).toBe('FAILED')

      // Verify failure state in database
      const { prisma } = require('../../../../src/lib/prisma')
      const failedTask = await prisma.task.findUnique({
        where: { id: task.id }
      })
      expect(failedTask.status).toBe('FAILED')
      expect(failedTask.payload.error).toBe('Analysis failed due to invalid input')
    })

    it('should handle task retry with real database', async () => {
      const task = await createTestTask({
        type: 'CRAWL',
        status: 'FAILED',
        priority: 5,
        payload: { retryCount: 2 }
      })

      // Retry task
      const retryResponse = await makeRequest('PUT', `/api/v1/tasks/${task.id}`, {
        status: 'PENDING',
        payload: { retryCount: 3 }
      })
      expect(retryResponse.status).toBe(200)
      expect(retryResponse.data.data.status).toBe('PENDING')

      // Verify retry state in database
      const { prisma } = require('../../../../src/lib/prisma')
      const retriedTask = await prisma.task.findUnique({
        where: { id: task.id }
      })
      expect(retriedTask.status).toBe('PENDING')
      expect(retriedTask.payload.retryCount).toBe(3)
    })
  })

})
