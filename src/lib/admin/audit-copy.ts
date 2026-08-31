const ACTION_LABELS: Record<string, string> = {
  'careers.carousel.add': 'Added a Work With Us photo',
  'careers.carousel.delete': 'Deleted a Work With Us photo',
  'careers.carousel.reorder': 'Reordered Work With Us photos',
  'careers.carousel.toggle': 'Changed Work With Us photo visibility',
  'careers.content.update': 'Updated Work with us content',
  'dam.asset.delete': 'Deleted media',
  'dam.asset.metadata.create': 'Created media details',
  'dam.asset.metadata.update': 'Updated media details',
  'dam.asset.service-tag.add': 'Linked media to a service',
  'dam.asset.service-tag.remove': 'Removed media from a service',
  'dam.asset.tag.remove': 'Removed a media tag',
  'dam.asset.tags.replace': 'Replaced media tags',
  'dam.asset.tags.bulk.add': 'Added tags to selected media',
  'dam.asset.tags.bulk.replace': 'Replaced tags on selected media',
  'dam.asset.team.assign': 'Assigned media to a team member',
  'dam.asset.team.remove': 'Removed a team member from media',
  'dam.asset.upload': 'Uploaded media',
  'dam.preferences.update': 'Updated media settings',
  'dam.set.create': 'Created a media set',
  'dam.set.photo.add': 'Added media to a set',
  'dam.set.photo.stage.update': 'Changed a media set photo stage',
  'dam.tags.catalog.update': 'Updated media tags',
  'dam.team.photo.create': 'Added a team photo',
  'dam.team.photo.crops.update': 'Updated team photo crops',
  'dam.team.photo.delete': 'Deleted a team photo',
  'dam.team.photo.delete.blocked': 'Tried to delete a protected team photo',
  'dam.team.photo.primary.set': 'Changed a primary team photo',
  'dam.team.photo.upload': 'Uploaded a team photo',
  'dam.upload.presigned.issue': 'Prepared a media upload',
  'design.feedback.send': 'Sent website design feedback',
  'faq.category.create': 'Created a question category',
  'faq.category.delete': 'Deleted a question category',
  'faq.category.update': 'Updated a question category',
  'faq.item.create': 'Created a question',
  'faq.item.delete': 'Deleted a question',
  'faq.item.update': 'Updated a question',
  'founder-letter.update': 'Updated the founder letter',
  'hero.archway.update': 'Updated the homepage arch photo',
  'hero.content.update': 'Updated the homepage hero text',
  'hero.slideshow.assignments.update': 'Updated homepage slideshow photos',
  'hero.slideshow.preset.create': 'Created a slideshow preset',
  'hero.slideshow.preset.delete': 'Deleted a slideshow preset',
  'hero.slideshow.preset.update': 'Updated a slideshow preset',
  'homepage-services.update': 'Updated homepage service cards',
  'instagram.settings.update': 'Updated Instagram settings',
  'quiz.photo.add': 'Added a Find Your Look photo',
  'quiz.photo.crop.update': 'Updated a Find Your Look photo crop',
  'quiz.photo.delete': 'Deleted a Find Your Look photo',
  'quiz.photo.enabled.update': 'Changed Find Your Look photo visibility',
  'quiz.photo.reorder': 'Reordered Find Your Look photos',
  'quiz.result-image.crop.update': 'Updated a Find Your Look result crop',
  'quiz.result-image.remove': 'Removed a Find Your Look result image',
  'quiz.result-image.update': 'Updated a Find Your Look result image',
  'quiz.result-settings.bootstrap': 'Created Find Your Look result settings',
  'quiz.result-settings.text.update': 'Updated Find Your Look result text',
  'review.homepage-selection.update': 'Updated homepage reviews',
  'review.override.update': 'Updated a review',
  'review.quality.rescore': 'Recalculated a review score',
  'review.stylist.suggest': 'Checked a review for a stylist match',
  'reviews.editor-pass.trigger': 'Requested automatic review scoring',
  'reviews.pipeline.update': 'Updated automatic review settings',
  'service-category.content.update': 'Updated service group text',
  'service-category.image.update': 'Updated a service group image',
  'service-subcategory.image.update': 'Updated a service subgroup image',
  'service-subcategory.reorder': 'Reordered service subgroups',
  'service.image.reset-to-vagaro': 'Switched a service back to its Vagaro image',
  'service.image.update': 'Updated a service image',
  'service.presentation.update': 'Updated service website details',
  'service.subcategory.assign': 'Changed a service subgroup',
  'seo.settings.update': 'Updated search and sharing settings',
  'studio.update': 'Updated studio information',
  'team.highlights.clear': 'Removed stylist highlights',
  'team.highlights.update': 'Updated stylist highlights',
  'team.member.update': 'Updated a team member',
  'team.member.webhook-create': 'Added a team member from Vagaro',
  'team.photo.crops.update': 'Updated team photo crops',
  'team.quick-fact.create': 'Added a stylist detail',
  'team.quick-fact.delete': 'Deleted a stylist detail',
  'team.quick-fact.reorder': 'Reordered stylist details',
  'team.quick-fact.update': 'Updated a stylist detail',
  'vagaro.sync.completed': 'Completed a Vagaro sync',
  'vagaro.sync.failed': 'Vagaro sync failed',
  'vagaro.sync.partial': 'Vagaro sync completed with issues',
  'vagaro.sync.requested': 'Requested a Vagaro sync',
  'vagaro.category.presentation.update': 'Updated Vagaro category display settings',
  'website-settings.restore': 'Restored website settings',
}

const SURFACE_LABELS: Record<string, string> = {
  admin: 'Admin',
  dam: 'Media',
  system: 'Automatic',
}

const TARGET_LABELS: Record<string, string> = {
  asset: 'Media',
  asset_batch: 'Media',
  'asset-service': 'Media and service link',
  'careers-carousel': 'Work With Us photos',
  'careers-carousel-photo': 'Work With Us photo',
  dam_asset: 'Media',
  dam_asset_batch: 'Media',
  dam_user_settings: 'Media settings',
  'design-feedback': 'Website design feedback',
  faq_category: 'Question category',
  faq_item: 'Question',
  homepage_reviews: 'Homepage reviews',
  newsletter_subscription: 'Newsletter subscriber',
  'quiz-photo': 'Find Your Look photo',
  'quiz-photo-collection': 'Find Your Look photos',
  'quiz-result-settings': 'Find Your Look result',
  review: 'Review',
  review_pipeline: 'Automatic review settings',
  service: 'Service',
  'service-category': 'Service group',
  'service-subcategory': 'Service subgroup',
  set: 'Media set',
  set_photo: 'Media set photo',
  storage_object: 'Media upload',
  tag_taxonomy: 'Media tags',
  'team-photo': 'Team photo',
  team_member: 'Team member',
  team_member_photo: 'Team photo',
  team_members: 'Team members',
  team_quick_fact: 'Stylist detail',
  user: 'Admin access',
  'vagaro-category': 'Vagaro category',
  vagaro_sync: 'Vagaro sync',
  website_settings: 'Website settings',
}

export function auditActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? sentenceCaseIdentifier(action)
}

export function auditTargetLabel(targetType: string): string {
  return TARGET_LABELS[targetType] ?? sentenceCaseIdentifier(targetType)
}

export function auditTargetReference(targetType: string, targetId: string | null | undefined): string {
  const label = auditTargetLabel(targetType)
  if (!targetId) return label
  if (targetId === 'bulk') return `${label} · multiple records`

  if (/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(targetId)) {
    return `${label} · record ${targetId.replace(/-/g, '').slice(-6)}`
  }
  if (/^[a-z0-9][a-z0-9._-]{0,60}$/i.test(targetId)) {
    return `${label} · ${sentenceCaseIdentifier(targetId)}`
  }
  return label
}

export function auditSurfaceLabel(surface: string): string {
  return SURFACE_LABELS[surface] ?? sentenceCaseIdentifier(surface)
}

function sentenceCaseIdentifier(value: string): string {
  const words = value.replace(/[._-]+/g, ' ').replace(/\s+/g, ' ').trim()
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : 'Admin'
}
