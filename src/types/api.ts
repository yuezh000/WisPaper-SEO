// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  pagination?: PaginationInfo
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

// Query Parameters
export interface PaginationParams {
  page?: number
  limit?: number
}

export interface SearchParams extends PaginationParams {
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
}

// Paper API Types
export interface PaperQueryParams extends SearchParams {
  conference_id?: string
  author_id?: string
  status?: string
  keyword?: string
}

export interface CreatePaperRequest {
  title: string
  abstract?: string
  doi?: string
  arxiv_id?: string
  pdf_url?: string
  publication_date?: string
  conference_id?: string
  venue?: string
  pages?: string
  volume?: string
  issue?: string
  author_ids: string[]
  keywords: string[]
}

export interface UpdatePaperRequest {
  title?: string
  abstract?: string
  status?: string
  seo_score?: number
}

// Conference API Types
export interface ConferenceQueryParams extends SearchParams {
  status?: string
  year?: number
}

export interface CreateConferenceRequest {
  name: string
  acronym?: string
  description?: string
  website?: string
  submission_deadline?: string
  notification_date?: string
  conference_date?: string
  venue_id?: string
  status: string
}

// Author API Types
export interface AuthorQueryParams extends SearchParams {
  institution_id?: string
}

export interface CreateAuthorRequest {
  name: string
  email?: string
  orcid?: string
  institution_id: string
  bio?: string
  homepage?: string
}

// Task API Types
export interface TaskQueryParams extends SearchParams {
  type?: string
  status?: string
  priority?: number
}

export interface CreateTaskRequest {
  type: string
  priority?: number
  payload: Record<string, any>
  scheduled_at?: string
}

// Search API Types
export interface SearchQueryParams extends PaginationParams {
  q: string
  type?: 'papers' | 'authors' | 'conferences' | 'all'
}

// Stats API Types
export interface StatsOverview {
  total_papers: number
  total_conferences: number
  total_journals: number
  total_authors: number
  total_institutions: number
  pending_tasks: number
  failed_tasks: number
  seo_score_avg: number
}
