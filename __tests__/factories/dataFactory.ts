/**
 * Test Data Factory
 * 
 * This module provides factory functions for creating test data
 * with realistic and varied test scenarios.
 */

import { faker } from '@faker-js/faker'

// Mock faker for testing environment
const mockFaker = {
  datatype: {
    uuid: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    number: (options: any) => Math.floor(Math.random() * (options.max - options.min + 1)) + options.min,
    boolean: () => Math.random() > 0.5,
  },
  name: {
    fullName: () => 'Test User ' + Math.random().toString(36).substr(2, 5),
  },
  internet: {
    email: () => 'test' + Math.random().toString(36).substr(2, 5) + '@example.com',
    url: () => 'https://example.com/' + Math.random().toString(36).substr(2, 5),
  },
  company: {
    name: () => 'Test Company ' + Math.random().toString(36).substr(2, 5),
  },
  lorem: {
    sentence: () => 'Test sentence ' + Math.random().toString(36).substr(2, 10),
    paragraph: () => 'Test paragraph ' + Math.random().toString(36).substr(2, 20),
  },
  date: {
    recent: () => new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    future: () => new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
  },
}

// Use mock faker in test environment
const fakerInstance = process.env.NODE_ENV === 'test' ? mockFaker : faker

export interface InstitutionData {
  id?: string
  name: string
  type?: string
  description?: string
  country?: string
  city?: string
  website?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface AuthorData {
  id?: string
  name: string
  email?: string
  orcid?: string
  institutionId?: string
  bio?: string
  homepage?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface ConferenceData {
  id?: string
  name: string
  acronym?: string
  description?: string
  website?: string
  submissionDeadline?: Date
  notificationDate?: Date
  conferenceDate?: Date
  venueId?: string
  status?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface JournalData {
  id?: string
  name: string
  acronym?: string
  issn?: string
  eissn?: string
  description?: string
  website?: string
  publisher?: string
  impactFactor?: number
  status?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface PaperData {
  id?: string
  title: string
  abstract?: string
  doi?: string
  arxivId?: string
  pdfUrl?: string
  publicationDate?: Date
  conferenceId?: string
  journalId?: string
  venue?: string
  pages?: string
  volume?: string
  issue?: string
  citationCount?: number
  status?: string
  seoScore?: number
  createdAt?: Date
  updatedAt?: Date
}

export interface TaskData {
  id?: string
  type?: string
  status?: string
  priority?: number
  payload: any
  result?: any
  errorMessage?: string
  retryCount?: number
  maxRetries?: number
  scheduledAt?: Date
  startedAt?: Date
  completedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

/**
 * Institution Factory
 */
export class InstitutionFactory {
  static create(overrides: Partial<InstitutionData> = {}): InstitutionData {
    const institutionTypes: string[] = 
      ['UNIVERSITY', 'RESEARCH_INSTITUTE', 'COMPANY']
    
    return {
      id: fakerInstance.datatype.uuid(),
      name: fakerInstance.company.name(),
      type: institutionTypes[Math.floor(Math.random() * institutionTypes.length)],
      description: fakerInstance.datatype.boolean() ? fakerInstance.lorem.paragraph() : undefined,
      country: fakerInstance.datatype.boolean() ? 'China' : 'United States',
      city: fakerInstance.datatype.boolean() ? 'Beijing' : 'New York',
      website: fakerInstance.datatype.boolean() ? fakerInstance.internet.url() : undefined,
      createdAt: fakerInstance.date.recent(),
      updatedAt: fakerInstance.date.recent(),
      ...overrides,
    }
  }

  static createMany(count: number, overrides: Partial<InstitutionData> = {}): InstitutionData[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createUniversity(overrides: Partial<InstitutionData> = {}): InstitutionData {
    return this.create({ type: 'UNIVERSITY', ...overrides })
  }

  static createResearchInstitute(overrides: Partial<InstitutionData> = {}): InstitutionData {
    return this.create({ type: 'RESEARCH_INSTITUTE', ...overrides })
  }

  static createCompany(overrides: Partial<InstitutionData> = {}): InstitutionData {
    return this.create({ type: 'COMPANY', ...overrides })
  }
}

/**
 * Author Factory
 */
export class AuthorFactory {
  static create(overrides: Partial<AuthorData> = {}): AuthorData {
    return {
      id: fakerInstance.datatype.uuid(),
      name: fakerInstance.name.fullName(),
      email: fakerInstance.datatype.boolean() ? fakerInstance.internet.email() : undefined,
      orcid: fakerInstance.datatype.boolean() ? 
        `0000-0000-0000-${Math.random().toString().substr(2, 4)}` : undefined,
      institutionId: fakerInstance.datatype.uuid(),
      bio: fakerInstance.datatype.boolean() ? fakerInstance.lorem.paragraph() : undefined,
      homepage: fakerInstance.datatype.boolean() ? fakerInstance.internet.url() : undefined,
      createdAt: fakerInstance.date.recent(),
      updatedAt: fakerInstance.date.recent(),
      ...overrides,
    }
  }

  static createMany(count: number, overrides: Partial<AuthorData> = {}): AuthorData[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createWithOrcid(overrides: Partial<AuthorData> = {}): AuthorData {
    return this.create({ 
      orcid: `0000-0000-0000-${Math.random().toString().substr(2, 4)}`,
      ...overrides 
    })
  }

  static createWithEmail(overrides: Partial<AuthorData> = {}): AuthorData {
    return this.create({ 
      email: fakerInstance.internet.email(),
      ...overrides 
    })
  }
}

/**
 * Conference Factory
 */
export class ConferenceFactory {
  static create(overrides: Partial<ConferenceData> = {}): ConferenceData {
    const statuses: string[] = 
      ['UPCOMING', 'ONGOING', 'COMPLETED']
    
    return {
      id: fakerInstance.datatype.uuid(),
      name: `Conference ${fakerInstance.datatype.number({ min: 1, max: 1000 })}`,
      acronym: fakerInstance.datatype.boolean() ? 
        `CC${fakerInstance.datatype.number({ min: 1, max: 99 })}` : undefined,
      description: fakerInstance.datatype.boolean() ? fakerInstance.lorem.paragraph() : undefined,
      website: fakerInstance.datatype.boolean() ? fakerInstance.internet.url() : undefined,
      submissionDeadline: fakerInstance.datatype.boolean() ? fakerInstance.date.future() : undefined,
      notificationDate: fakerInstance.datatype.boolean() ? fakerInstance.date.future() : undefined,
      conferenceDate: fakerInstance.datatype.boolean() ? fakerInstance.date.future() : undefined,
      venueId: fakerInstance.datatype.boolean() ? fakerInstance.datatype.uuid() : undefined,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: fakerInstance.date.recent(),
      updatedAt: fakerInstance.date.recent(),
      ...overrides,
    }
  }

  static createMany(count: number, overrides: Partial<ConferenceData> = {}): ConferenceData[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createUpcoming(overrides: Partial<ConferenceData> = {}): ConferenceData {
    return this.create({ status: 'UPCOMING', ...overrides })
  }

  static createOngoing(overrides: Partial<ConferenceData> = {}): ConferenceData {
    return this.create({ status: 'ONGOING', ...overrides })
  }

  static createCompleted(overrides: Partial<ConferenceData> = {}): ConferenceData {
    return this.create({ status: 'COMPLETED', ...overrides })
  }
}

/**
 * Journal Factory
 */
export class JournalFactory {
  static create(overrides: Partial<JournalData> = {}): JournalData {
    const statuses: string[] = 
      ['ACTIVE', 'INACTIVE', 'SUSPENDED']
    
    return {
      id: fakerInstance.datatype.uuid(),
      name: `Journal ${fakerInstance.datatype.number({ min: 1, max: 1000 })}`,
      acronym: fakerInstance.datatype.boolean() ? 
        `J${fakerInstance.datatype.number({ min: 1, max: 99 })}` : undefined,
      issn: fakerInstance.datatype.boolean() ? 
        `${fakerInstance.datatype.number({ min: 1000, max: 9999 })}-${fakerInstance.datatype.number({ min: 1000, max: 9999 })}` : undefined,
      eissn: fakerInstance.datatype.boolean() ? 
        `${fakerInstance.datatype.number({ min: 1000, max: 9999 })}-${fakerInstance.datatype.number({ min: 1000, max: 9999 })}` : undefined,
      description: fakerInstance.datatype.boolean() ? fakerInstance.lorem.paragraph() : undefined,
      website: fakerInstance.datatype.boolean() ? fakerInstance.internet.url() : undefined,
      publisher: fakerInstance.datatype.boolean() ? fakerInstance.company.name() : undefined,
      impactFactor: fakerInstance.datatype.boolean() ? 
        parseFloat((Math.random() * 10).toFixed(2)) : undefined,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: fakerInstance.date.recent(),
      updatedAt: fakerInstance.date.recent(),
      ...overrides,
    }
  }

  static createMany(count: number, overrides: Partial<JournalData> = {}): JournalData[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createActive(overrides: Partial<JournalData> = {}): JournalData {
    return this.create({ status: 'ACTIVE', ...overrides })
  }

  static createWithImpactFactor(overrides: Partial<JournalData> = {}): JournalData {
    return this.create({ 
      impactFactor: parseFloat((Math.random() * 10).toFixed(2)),
      ...overrides 
    })
  }
}

/**
 * Paper Factory
 */
export class PaperFactory {
  static create(overrides: Partial<PaperData> = {}): PaperData {
    const statuses: string[] = 
      ['DRAFT', 'PUBLISHED', 'ARCHIVED']
    
    return {
      id: fakerInstance.datatype.uuid(),
      title: fakerInstance.lorem.sentence(),
      abstract: fakerInstance.datatype.boolean() ? fakerInstance.lorem.paragraph() : undefined,
      doi: fakerInstance.datatype.boolean() ? 
        `10.1000/${Math.random().toString().substr(2, 8)}` : undefined,
      arxivId: fakerInstance.datatype.boolean() ? 
        `${Math.random().toString().substr(2, 4)}.${Math.random().toString().substr(2, 4)}` : undefined,
      pdfUrl: fakerInstance.datatype.boolean() ? fakerInstance.internet.url() : undefined,
      publicationDate: fakerInstance.datatype.boolean() ? fakerInstance.date.recent() : undefined,
      conferenceId: fakerInstance.datatype.boolean() ? fakerInstance.datatype.uuid() : undefined,
      journalId: fakerInstance.datatype.boolean() ? fakerInstance.datatype.uuid() : undefined,
      venue: fakerInstance.datatype.boolean() ? fakerInstance.company.name() : undefined,
      pages: fakerInstance.datatype.boolean() ? 
        `${fakerInstance.datatype.number({ min: 1, max: 20 })}-${fakerInstance.datatype.number({ min: 21, max: 50 })}` : undefined,
      volume: fakerInstance.datatype.boolean() ? 
        fakerInstance.datatype.number({ min: 1, max: 100 }).toString() : undefined,
      issue: fakerInstance.datatype.boolean() ? 
        fakerInstance.datatype.number({ min: 1, max: 12 }).toString() : undefined,
      citationCount: fakerInstance.datatype.number({ min: 0, max: 1000 }),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      seoScore: fakerInstance.datatype.boolean() ? 
        parseFloat((Math.random() * 10).toFixed(1)) : undefined,
      createdAt: fakerInstance.date.recent(),
      updatedAt: fakerInstance.date.recent(),
      ...overrides,
    }
  }

  static createMany(count: number, overrides: Partial<PaperData> = {}): PaperData[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createPublished(overrides: Partial<PaperData> = {}): PaperData {
    return this.create({ status: 'PUBLISHED', ...overrides })
  }

  static createDraft(overrides: Partial<PaperData> = {}): PaperData {
    return this.create({ status: 'DRAFT', ...overrides })
  }

  static createWithHighSeoScore(overrides: Partial<PaperData> = {}): PaperData {
    return this.create({ 
      seoScore: parseFloat((Math.random() * 3 + 7).toFixed(1)), // 7.0 - 10.0
      ...overrides 
    })
  }
}

/**
 * Task Factory
 */
export class TaskFactory {
  static create(overrides: Partial<TaskData> = {}): TaskData {
    const types: string[] = 
      ['CRAWL', 'PARSE_PDF', 'GENERATE_ABSTRACT', 'INDEX_PAGE']
    const statuses: string[] = 
      ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']
    
    return {
      id: fakerInstance.datatype.uuid(),
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: fakerInstance.datatype.number({ min: 1, max: 10 }),
      payload: { url: fakerInstance.internet.url() },
      result: fakerInstance.datatype.boolean() ? { success: true } : undefined,
      errorMessage: fakerInstance.datatype.boolean() ? 'Test error message' : undefined,
      retryCount: fakerInstance.datatype.number({ min: 0, max: 3 }),
      maxRetries: fakerInstance.datatype.number({ min: 1, max: 5 }),
      scheduledAt: fakerInstance.datatype.boolean() ? fakerInstance.date.future() : undefined,
      startedAt: fakerInstance.datatype.boolean() ? fakerInstance.date.recent() : undefined,
      completedAt: fakerInstance.datatype.boolean() ? fakerInstance.date.recent() : undefined,
      createdAt: fakerInstance.date.recent(),
      updatedAt: fakerInstance.date.recent(),
      ...overrides,
    }
  }

  static createMany(count: number, overrides: Partial<TaskData> = {}): TaskData[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createPending(overrides: Partial<TaskData> = {}): TaskData {
    return this.create({ status: 'PENDING', ...overrides })
  }

  static createRunning(overrides: Partial<TaskData> = {}): TaskData {
    return this.create({ status: 'RUNNING', ...overrides })
  }

  static createCompleted(overrides: Partial<TaskData> = {}): TaskData {
    return this.create({ status: 'COMPLETED', ...overrides })
  }

  static createFailed(overrides: Partial<TaskData> = {}): TaskData {
    return this.create({ 
      status: 'FAILED', 
      errorMessage: 'Test error message',
      ...overrides 
    })
  }
}

/**
 * Test Scenario Builder
 */
export class TestScenarioBuilder {
  static createInstitutionWithAuthors(
    institutionOverrides: Partial<InstitutionData> = {},
    authorCount: number = 3
  ) {
    const institution = InstitutionFactory.create(institutionOverrides)
    const authors = AuthorFactory.createMany(authorCount, { 
      institutionId: institution.id! 
    })
    
    return { institution, authors }
  }

  static createConferenceWithPapers(
    conferenceOverrides: Partial<ConferenceData> = {},
    paperCount: number = 5
  ) {
    const conference = ConferenceFactory.create(conferenceOverrides)
    const papers = PaperFactory.createMany(paperCount, { 
      conferenceId: conference.id! 
    })
    
    return { conference, papers }
  }

  static createJournalWithPapers(
    journalOverrides: Partial<JournalData> = {},
    paperCount: number = 10
  ) {
    const journal = JournalFactory.create(journalOverrides)
    const papers = PaperFactory.createMany(paperCount, { 
      journalId: journal.id! 
    })
    
    return { journal, papers }
  }

  static createAuthorWithPapers(
    authorOverrides: Partial<AuthorData> = {},
    paperCount: number = 3
  ) {
    const author = AuthorFactory.create(authorOverrides)
    const papers = PaperFactory.createMany(paperCount)
    
    return { author, papers }
  }
}

export default {
  InstitutionFactory,
  AuthorFactory,
  ConferenceFactory,
  JournalFactory,
  PaperFactory,
  TaskFactory,
  TestScenarioBuilder,
}
