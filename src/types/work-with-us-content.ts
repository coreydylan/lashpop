export const WORK_WITH_US_CONTENT_SECTION = 'work_with_us_content' as const

export interface WorkWithUsPathCardContent {
  title: string
  description: string
}

export interface WorkWithUsContent {
  heroEyebrow: string
  heroTitle: string
  heroDescription: string
  employee: WorkWithUsPathCardContent
  booth: WorkWithUsPathCardContent
  training: WorkWithUsPathCardContent
}

export const DEFAULT_WORK_WITH_US_CONTENT: WorkWithUsContent = {
  heroEyebrow: 'Join Our Team',
  heroTitle: 'Find Your Place at LashPop',
  heroDescription: 'Three paths to be part of something special. Choose what fits you best.',
  employee: {
    title: 'Join as an Employee',
    description: 'Full support, training, and benefits. Perfect for those who want structure and growth.',
  },
  booth: {
    title: 'Booth Rental',
    description: 'Run your own business in our beautiful space. Independence with community.',
  },
  training: {
    title: 'LashPop Pro Training',
    description: 'Master the LashPop approach to lash artistry. Comprehensive training program.',
  },
}

function mergeCard(
  input: Partial<WorkWithUsPathCardContent> | null | undefined,
  fallback: WorkWithUsPathCardContent,
): WorkWithUsPathCardContent {
  return {
    title: input?.title?.trim() || fallback.title,
    description: input?.description?.trim() || fallback.description,
  }
}

export function mergeWorkWithUsContent(
  input: Partial<WorkWithUsContent> | null | undefined,
): WorkWithUsContent {
  return {
    heroEyebrow: input?.heroEyebrow?.trim() || DEFAULT_WORK_WITH_US_CONTENT.heroEyebrow,
    heroTitle: input?.heroTitle?.trim() || DEFAULT_WORK_WITH_US_CONTENT.heroTitle,
    heroDescription: input?.heroDescription?.trim() || DEFAULT_WORK_WITH_US_CONTENT.heroDescription,
    employee: mergeCard(input?.employee, DEFAULT_WORK_WITH_US_CONTENT.employee),
    booth: mergeCard(input?.booth, DEFAULT_WORK_WITH_US_CONTENT.booth),
    training: mergeCard(input?.training, DEFAULT_WORK_WITH_US_CONTENT.training),
  }
}
