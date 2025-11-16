/**
 * Batch Job Status Endpoint
 *
 * GET /api/dam/social-variants/batch/:jobId
 *
 * Retrieves the status and progress of a batch generation job.
 *
 * Example curl:
 * curl http://localhost:3000/api/dam/social-variants/batch/batch-1234567890-abc123
 */

import { NextRequest, NextResponse } from 'next/server'
import { BatchStatusResponse } from '@/types/social-variants'

// Import jobs map from parent route
// Note: In production, this should query a Redis cache or database
import { jobs } from '../route'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params

    // Look up job status
    const job = jobs.get(jobId)

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    const response: BatchStatusResponse = {
      status: job.status,
      progress: job.progress,
      completed: job.completed,
      total: job.total,
      results: job.status === 'completed' ? job.results : undefined
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    console.error('Error fetching batch job status:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch job status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
