"use client"

import { useState } from "react"
import { X, Users } from "lucide-react"
import { SharedUsersList } from "./SharedUsersList"
import { PublicLinkPanel } from "./PublicLinkPanel"
import { ShareActivityLog } from "./ShareActivityLog"

interface ShareModalProps {
  resourceId: string
  resourceType: "asset" | "collection" | "set"
  onClose: () => void
}

export function ShareModal({ resourceId, resourceType, onClose }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<"users" | "link" | "activity">("users")

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dune/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-cream rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border-2 border-sage/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-sage/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-dusty-rose/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-dusty-rose" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-dune">Share {resourceType}</h2>
              <p className="caption text-sage">Manage access and permissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-sage/10 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-sage" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-sage/10">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors ${
              activeTab === "users"
                ? "bg-cream text-dune border-b-2 border-dusty-rose"
                : "text-sage hover:text-dune"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("link")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors ${
              activeTab === "link"
                ? "bg-cream text-dune border-b-2 border-dusty-rose"
                : "text-sage hover:text-dune"
            }`}
          >
            Public Link
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 text-sm font-semibold rounded-t-xl transition-colors ${
              activeTab === "activity"
                ? "bg-cream text-dune border-b-2 border-dusty-rose"
                : "text-sage hover:text-dune"
            }`}
          >
            Activity
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === "users" && (
            <SharedUsersList
              resourceId={resourceId}
              resourceType={resourceType}
              isOwner={true}
            />
          )}
          {activeTab === "link" && (
            <PublicLinkPanel
              resourceId={resourceId}
              resourceType={resourceType}
              isOwner={true}
            />
          )}
          {activeTab === "activity" && (
            <ShareActivityLog
              resourceId={resourceId}
              resourceType={resourceType}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-sage/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-dune text-cream hover:bg-dune/90 transition-colors body font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
