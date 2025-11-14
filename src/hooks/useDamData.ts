/**
 * React Query hooks for DAM data fetching
 * Provides optimized caching and automatic background refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Asset {
  id: string
  fileName: string
  filePath: string
  fileType: "image" | "video"
  uploadedAt: Date
  teamMemberId?: string
  tags?: Array<{
    id: string
    name: string
    displayName: string
    category: {
      id: string
      name: string
      displayName: string
      color?: string
    }
  }>
}

interface TeamMember {
  id: string
  name: string
  imageUrl: string
  cropCloseUpCircle?: {
    x: number
    y: number
    scale: number
  } | null
}

interface TagCategory {
  id: string
  name: string
  displayName: string
  color?: string
  isCollection?: boolean
  isRating?: boolean
  tags: Array<{
    id: string
    name: string
    displayName: string
  }>
}

interface InitialData {
  assets: Asset[]
  categories: TagCategory[]
  teamMembers: TeamMember[]
}

/**
 * Fetch all initial DAM data in a single request
 * Combines assets, tags, and team members for faster initial load
 */
export function useDamInitialData() {
  return useQuery<InitialData>({
    queryKey: ['dam-initial-data'],
    queryFn: async () => {
      const response = await fetch('/api/dam/initial-data')
      if (!response.ok) {
        throw new Error('Failed to fetch initial data')
      }
      return response.json()
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  })
}

/**
 * Fetch assets only (for refreshing after mutations)
 */
export function useDamAssets() {
  return useQuery<{ assets: Asset[] }>({
    queryKey: ['dam-assets'],
    queryFn: async () => {
      const response = await fetch('/api/dam/assets')
      if (!response.ok) {
        throw new Error('Failed to fetch assets')
      }
      return response.json()
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })
}

/**
 * Fetch team members only
 */
export function useDamTeamMembers() {
  return useQuery<{ teamMembers: TeamMember[] }>({
    queryKey: ['dam-team-members'],
    queryFn: async () => {
      const response = await fetch('/api/dam/team-members')
      if (!response.ok) {
        throw new Error('Failed to fetch team members')
      }
      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute - team members change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

/**
 * Fetch tag categories
 */
export function useDamTags() {
  return useQuery<{ categories: TagCategory[] }>({
    queryKey: ['dam-tags'],
    queryFn: async () => {
      const response = await fetch('/api/dam/tags')
      if (!response.ok) {
        throw new Error('Failed to fetch tags')
      }
      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute - tags change infrequently
    gcTime: 10 * 60 * 1000,
  })
}

/**
 * Mutation for uploading assets
 */
export function useUploadAsset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/dam/upload', {
        method: 'POST',
        body: formData,
      })
      if (!response.ok) {
        throw new Error('Failed to upload asset')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch assets after upload
      queryClient.invalidateQueries({ queryKey: ['dam-assets'] })
      queryClient.invalidateQueries({ queryKey: ['dam-initial-data'] })
    },
  })
}

/**
 * Mutation for deleting assets
 */
export function useDeleteAssets() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assetIds: string[]) => {
      const response = await fetch('/api/dam/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds }),
      })
      if (!response.ok) {
        throw new Error('Failed to delete assets')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dam-assets'] })
      queryClient.invalidateQueries({ queryKey: ['dam-initial-data'] })
    },
  })
}

/**
 * Mutation for bulk tagging
 */
export function useBulkTagAssets() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ assetIds, tagIds }: { assetIds: string[]; tagIds: string[] }) => {
      const response = await fetch('/api/dam/assets/bulk-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds, tagIds }),
      })
      if (!response.ok) {
        throw new Error('Failed to tag assets')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dam-assets'] })
      queryClient.invalidateQueries({ queryKey: ['dam-initial-data'] })
    },
  })
}
