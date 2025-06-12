"use client"
import Loading from "@/app/[locale]/loading"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatbotUIContext } from "@/context/context"
// Data fetched from server via consolidated API
// import { getAssistantToolsByAssistantId } from "@/db/assistant-tools"
// import { getChatFilesByChatId } from "@/db/chat-files"
// import { getChatById } from "@/db/chats"
// import { getMessageFileItemsByMessageId } from "@/db/message-file-items"
// import { getMessagesByChatId } from "@/db/messages"
import { getMessageImageFromStorage } from "@/db/storage/message-images"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import useHotkey from "@/lib/hooks/use-hotkey"
import { LLMID, MessageImage } from "@/types"
import { useParams } from "next/navigation"
import { FC, useContext, useEffect, useState } from "react"
import { ChatHelp } from "./chat-help"
import { useScroll } from "./chat-hooks/use-scroll"
import { ChatInput } from "./chat-input"
import { ChatMessages } from "./chat-messages"
import { ChatScrollButtons } from "./chat-scroll-buttons"
import { ChatSecondaryButtons } from "./chat-secondary-buttons"

interface ChatUIProps {}

export const ChatUI: FC<ChatUIProps> = ({}) => {
  useHotkey("o", () => handleNewChat())

  const params = useParams()

  const {
    setChatMessages,
    selectedChat,
    setSelectedChat,
    setChatSettings,
    setChatImages,
    assistants,
    setSelectedAssistant,
    setChatFileItems,
    setChatFiles,
    setShowFilesDisplay,
    setUseRetrieval,
    setSelectedTools
  } = useContext(ChatbotUIContext)

  const { handleNewChat, handleFocusChatInput } = useChatHandler()

  const {
    messagesStartRef,
    messagesEndRef,
    handleScroll,
    scrollToBottom,
    setIsAtBottom,
    isAtTop,
    isAtBottom,
    isOverflowing,
    scrollToTop
  } = useScroll()

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!params.chatid) {
      // No chat ID in URL: use context (e.g. new chat) and stop loading
      setLoading(false)
      return
    }
    const fetchData = async () => {
      const res = await fetch(`/api/chat-data?chatId=${params.chatid}`)
      if (!res.ok) {
        console.error('Failed to load chat data:', res.statusText)
        setLoading(false)
        return
      }
      const { chat, assistantTools, messages, chatFileItems, chatFiles } = await res.json()
      // messages is already hydrated: { message, fileItems }
      setChatMessages(messages)
      setChatFileItems(chatFileItems)
      setChatFiles(chatFiles)
      if (chat.assistant_id) {
        const assistant = assistants.find(a => a.id === chat.assistant_id)
        if (assistant) {
          setSelectedAssistant(assistant)
          setSelectedTools(assistantTools)
        }
      }
      setSelectedChat(chat)
      setChatSettings({
        model: chat.model as LLMID,
        prompt: chat.prompt,
        temperature: chat.temperature,
        contextLength: chat.context_length,
        includeProfileContext: chat.include_profile_context,
        includeWorkspaceInstructions: chat.include_workspace_instructions,
        embeddingsProvider: chat.embeddings_provider as "openai" | "local"
      })
      scrollToBottom()
      setIsAtBottom(true)
      setLoading(false)
    }
    fetchData()
  }, [params.chatid])


  const [chatName, setChatName] = useState<string>(selectedChat?.name || "")
  useEffect(() => {
    setChatName(selectedChat?.name || "")
  }, [selectedChat?.id])
  const handleNameBlur = async () => {
    if (!selectedChat) return
    if (chatName !== selectedChat.name) {
      try {
        const res = await fetch('/api/chats', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedChat.id, name: chatName })
        })
        if (res.ok) {
          const updated = await res.json()
          setSelectedChat(updated)
        }
      } catch (e) {
        console.error('Failed to rename chat', e)
      }
    }
  }
  if (loading) {
    return <Loading />
  }

  return (
    <div className="relative flex h-full flex-col items-center">
      <div className="absolute left-4 top-2.5 flex justify-center">
        <ChatScrollButtons
          isAtTop={isAtTop}
          isAtBottom={isAtBottom}
          isOverflowing={isOverflowing}
          scrollToTop={scrollToTop}
          scrollToBottom={scrollToBottom}
        />
      </div>

      <div className="absolute right-4 top-1 flex h-[40px] items-center space-x-2">
        <ChatSecondaryButtons />
      </div>

      <div className="bg-secondary flex max-h-[50px] min-h-[50px] w-full items-center justify-center border-b-2">
        <input
          className="bg-transparent focus:outline-none text-center font-bold truncate w-full max-w-[200px] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[600px] xl:max-w-[700px]"
          value={chatName}
          onChange={e => setChatName(e.target.value)}
          onBlur={handleNameBlur}
          placeholder="Chat"
        />
      </div>

      <div
        className="flex size-full flex-col overflow-auto border-b"
        onScroll={handleScroll}
      >
        <div ref={messagesStartRef} />

        <ChatMessages />

        <div ref={messagesEndRef} />
      </div>

      <div className="relative w-full min-w-[300px] items-end px-2 pb-3 pt-0 sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px]">
        <ChatInput />
      </div>

      <div className="absolute bottom-2 right-2 hidden md:block lg:bottom-4 lg:right-4">
        <ChatHelp />
      </div>
    </div>
  )
}
