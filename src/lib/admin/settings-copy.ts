import type { WebsiteSettingSource } from '@/lib/admin/settings-registry'

export function websiteSettingVersionLabel(version: number): string {
  return version === 0 ? 'No Admin version saved' : `Saved version ${version}`
}

export function websiteSettingSourceLabel(sourceOwner: string, version: number): string {
  if (version === 0) return 'Using website defaults'

  switch (sourceOwner as WebsiteSettingSource) {
    case 'admin':
      return 'Saved in Admin'
    case 'history-restore':
      return 'Restored from Website versions'
    case 'migration':
      return 'Imported into Admin'
    case 'system':
      return 'Updated automatically'
    default:
      return 'Saved setting'
  }
}

export function websiteSettingStatusLabel(sourceOwner: string, version: number): string {
  return `${websiteSettingVersionLabel(version)} · ${websiteSettingSourceLabel(sourceOwner, version)}`
}
