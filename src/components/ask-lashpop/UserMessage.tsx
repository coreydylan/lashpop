'use client'

import type { ChatMessage } from '@/lib/ask-lashpop/types'

interface UserMessageProps {
  message: ChatMessage
}

export function UserMessage({ message }: UserMessageProps) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] bg-dusty-rose text-white rounded-2xl rounded-tr-md px-4 py-3 shadow-sm">
        <p className="text-sm whitespace-pre-wrap leading-relaxed">
          {message.content}
        </p>
      </div>
    </div>
  )
}
