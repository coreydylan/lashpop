'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDb } from '@/db'
import { services } from '@/db/schema/services'
import { requireAdminRole } from '@/lib/admin/auth'
import { recordAdminAction } from '@/lib/admin/audit'

function cleanText(value: FormDataEntryValue | null, max: number): string | null {
  if (typeof value !== 'string') return null
  const clean = value.trim()
  return clean ? clean.slice(0, max) : null
}

export async function updateServicePresentation(formData: FormData) {
  const auth = await requireAdminRole('owner', 'publisher')
  const id = formData.get('id')
  const baseUpdatedAt = formData.get('baseUpdatedAt')
  if (typeof id !== 'string' || typeof baseUpdatedAt !== 'string') throw new Error('Invalid service update')

  const subtitle = cleanText(formData.get('subtitle'), 160)
  const description = cleanText(formData.get('description'), 4000)
  const db = getDb()
  const [before] = await db
    .select({ subtitle: services.subtitle, description: services.description, updatedAt: services.updatedAt })
    .from(services)
    .where(eq(services.id, id))
    .limit(1)

  if (!before) throw new Error('Service not found')
  if (new Date(before.updatedAt).getTime() !== Number(baseUpdatedAt)) {
    redirect(`/admin/website/services/${id}?conflict=1`)
  }

  const updated = await db
    .update(services)
    .set({ subtitle, description, updatedAt: new Date() })
    .where(and(eq(services.id, id), eq(services.updatedAt, before.updatedAt)))
    .returning({ id: services.id })

  if (updated.length === 0) redirect(`/admin/website/services/${id}?conflict=1`)

  await recordAdminAction({
    action: 'service.presentation.update',
    targetType: 'service',
    targetId: id,
    actorUserId: auth.userId,
    diff: {
      before: { subtitle: before.subtitle, description: before.description },
      after: { subtitle, description },
    },
  })

  revalidatePath('/')
  revalidatePath(`/admin/website/services/${id}`)
  redirect(`/admin/website/services/${id}?saved=1`)
}
