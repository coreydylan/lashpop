"use client"

import { Plus } from "lucide-react"
import clsx from "clsx"

interface Collection {
  id: string
  name: string
  displayName: string
  color?: string
}

interface CollectionSelectorProps {
  collections: Collection[]
  activeCollectionId?: string
  onSelectCollection: (collectionId: string | undefined) => void
  onCreateCollection?: () => void
}

export function CollectionSelector({
  collections,
  activeCollectionId,
  onSelectCollection,
  onCreateCollection
}: CollectionSelectorProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {/* All Collections chip */}
      <button
        onClick={() => onSelectCollection(undefined)}
        className={clsx(
          "flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border-2",
          !activeCollectionId
            ? "bg-dune text-cream border-dune shadow-md"
            : "bg-cream text-dune border-sage/20 hover:border-dusty-rose/40 hover:shadow-sm"
        )}
      >
        All
      </button>

      {/* Individual collection chips */}
      {collections.map((collection) => (
        <button
          key={collection.id}
          onClick={() => onSelectCollection(collection.id)}
          className={clsx(
            "flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all border-2",
            activeCollectionId === collection.id
              ? "text-cream border-opacity-60 shadow-md"
              : "bg-cream text-dune border-sage/20 hover:border-dusty-rose/40 hover:shadow-sm"
          )}
          style={
            activeCollectionId === collection.id && collection.color
              ? {
                  backgroundColor: collection.color,
                  borderColor: collection.color
                }
              : undefined
          }
        >
          {collection.displayName}
        </button>
      ))}

      {/* Create new collection button */}
      {onCreateCollection && (
        <button
          onClick={onCreateCollection}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold transition-all border-2 border-dashed border-sage/30 text-sage hover:border-dusty-rose/50 hover:text-dusty-rose"
        >
          <Plus className="w-4 h-4" />
          <span>New</span>
        </button>
      )}
    </div>
  )
}
