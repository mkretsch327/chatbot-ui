// @ts-nocheck
"use client"
import { useContext } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChatbotUIContext } from "@/context/context"

interface SidebarProps {
  contentType: string
  showSidebar: boolean
}

export const Sidebar = ({ contentType, showSidebar }: SidebarProps) => {
  if (!showSidebar) return null
  const { chats } = useContext(ChatbotUIContext)
  const params = useParams()
  const locale = params.locale as string
  const workspaceid = params.workspaceid as string

  if (contentType === "chats") {
    return (
      <div className="p-4 border-r">
        {chats.map((chat: any) => (
          <Link
            href={`/${locale}/${workspaceid}/chat/${chat.id}`}
            key={chat.id}
            className="block p-2 mb-2 rounded hover:bg-gray-200"
          >
            {chat.name || "Untitled Chat"}
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="p-4 border-r">
      {contentType}
    </div>
  )
}