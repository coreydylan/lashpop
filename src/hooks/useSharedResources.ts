/**
 * React Query hook for fetching shared resources
 * Used on the "Shared with me" page
 */

import { useQuery } from '@tanstack/react-query'

interface SharedResource {
  id: string
  resourceType: "asset" | "set" | "collection"
  resourceId: string
  sharedBy: {
    id: string
    name: string
    imageUrl?: string
  }
  sharedAt: Date
  permission: "view" | "edit" | "comment"
  resource: {
    id: string
    name: string
    thumbnailUrl?: string
    itemCount?: number
  }
}

interface SharedResourcesResponse {
  resources: SharedResource[]
}

/**
 * Fetch all resources shared with the current user
 * Includes assets, sets, and collections
 */
export function useSharedResources() {
  return useQuery<SharedResourcesResponse>({
    queryKey: ['shared-resources'],
    queryFn: async () => {
      const response = await fetch('/api/dam/sharing/my-shared')
      if (!response.ok) {
        throw new Error('Failed to fetch shared resources')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  })
}
