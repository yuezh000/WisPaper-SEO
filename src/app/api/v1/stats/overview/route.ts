import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createApiResponse, handleApiError } from '@/utils/api'
import { StatsOverview } from '@/types/api'

// GET /api/v1/stats/overview - Get system overview statistics
export async function GET(request: NextRequest) {
  try {
    // Get all statistics in parallel
    const [
      totalPapers,
      totalConferences,
      totalAuthors,
      pendingTasks,
      failedTasks,
      avgSeoScore
    ] = await Promise.all([
      prisma.paper.count(),
      prisma.conference.count(),
      prisma.author.count(),
      prisma.task.count({ where: { status: 'PENDING' } }),
      prisma.task.count({ where: { status: 'FAILED' } }),
      prisma.paper.aggregate({
        _avg: {
          seoScore: true
        },
        where: {
          seoScore: {
            not: null
          }
        }
      })
    ])

    const stats: StatsOverview = {
      total_papers: totalPapers,
      total_conferences: totalConferences,
      total_authors: totalAuthors,
      pending_tasks: pendingTasks,
      failed_tasks: failedTasks,
      seo_score_avg: avgSeoScore._avg.seoScore || 0
    }

    return createApiResponse(stats, 'Statistics retrieved successfully')
  } catch (error) {
    return handleApiError(error)
  }
}
