// Jest setup file
import { TextEncoder, TextDecoder } from 'util'

// Polyfill for TextEncoder/TextDecoder in Node.js environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/wispaper_seo_test'
process.env.NODE_ENV = 'test'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/',
}))

// Mock Prisma client
jest.mock('./src/lib/prisma', () => ({
  prisma: {
    institution: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    author: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    conference: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    journal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    paper: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    task: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    venue: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}))

// Global test utilities
global.testUtils = {
  createMockRequest: (method = 'GET', body = null, params = {}) => ({
    method,
    json: jest.fn().mockResolvedValue(body),
    url: 'http://localhost:3000/api/v1/test',
    nextUrl: {
      searchParams: new URLSearchParams(params),
    },
  }),
  
  createMockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    }
    return res
  },
  
  createMockInstitution: (overrides = {}) => ({
    id: 'test-institution-id',
    name: 'Test University',
    type: 'UNIVERSITY',
    country: 'China',
    city: 'Beijing',
    website: 'https://test.edu.cn',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
  
  createMockAuthor: (overrides = {}) => ({
    id: 'test-author-id',
    name: 'Test Author',
    email: 'test@example.com',
    orcid: '0000-0000-0000-0000',
    institutionId: 'test-institution-id',
    bio: 'Test bio',
    homepage: 'https://test-author.com',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    institution: {
      id: 'test-institution-id',
      name: 'Test University',
      type: 'UNIVERSITY',
    },
    ...overrides,
  }),
  
  createMockConference: (overrides = {}) => ({
    id: 'test-conference-id',
    name: 'Test Conference',
    acronym: 'TC',
    description: 'Test conference description',
    website: 'https://test-conference.com',
    submissionDeadline: new Date('2024-06-01'),
    notificationDate: new Date('2024-07-01'),
    conferenceDate: new Date('2024-08-01'),
    venueId: 'test-venue-id',
    status: 'UPCOMING',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
  
  createMockJournal: (overrides = {}) => ({
    id: 'test-journal-id',
    name: 'Test Journal',
    acronym: 'TJ',
    issn: '1234-5678',
    eissn: '8765-4321',
    description: 'Test journal description',
    website: 'https://test-journal.com',
    publisher: 'Test Publisher',
    impactFactor: 2.5,
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
  
  createMockPaper: (overrides = {}) => ({
    id: 'test-paper-id',
    title: 'Test Paper Title',
    abstract: 'Test paper abstract',
    doi: '10.1000/test',
    arxivId: '1234.5678',
    pdfUrl: 'https://test-paper.pdf',
    publicationDate: new Date('2024-01-01'),
    conferenceId: 'test-conference-id',
    journalId: 'test-journal-id',
    venue: 'Test Venue',
    pages: '1-10',
    volume: '1',
    issue: '1',
    citationCount: 0,
    status: 'DRAFT',
    seoScore: 7.5,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
  
  createMockTask: (overrides = {}) => ({
    id: 'test-task-id',
    type: 'CRAWL',
    status: 'PENDING',
    priority: 5,
    payload: { url: 'https://example.com' },
    result: null,
    errorMessage: null,
    retryCount: 0,
    maxRetries: 3,
    scheduledAt: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }),
}
