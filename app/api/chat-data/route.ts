import { NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server/server-chat-helpers'
import { getChatById } from '@/db/chats'
import { getToolsByAssistantId } from '@/db/assistant-tools'
import { getMessagesByChatId } from '@/db/messages'
import { getFileItemsByMessageId } from '@/db/message-file-items'
import { getFilesByChatId } from '@/db/chat-files'

export const runtime = 'nodejs'

/**
 * GET /api/chat-data?chatId=...
 * Returns all data needed to render the chat UI in one request.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get('chatId')
    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId' }, { status: 400 })
    }
    const profile = await getServerProfile()
    const chat = await getChatById(chatId)
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
    }
    // Assistant tools
    let assistantTools: any[] = []
    if (chat.assistant_id) {
      assistantTools = await getToolsByAssistantId(chat.assistant_id)
    }
    // Messages
    const messages = await getMessagesByChatId(chatId)
    // Fetch file items for each message
    const messageFileItemsByMessage = await Promise.all(
      messages.map(msg => getFileItemsByMessageId(msg.id))
    )
    // Flatten file items for chat-level context
    const chatFileItems = messageFileItemsByMessage.flat()
    // Hydrate messages with list of file_item IDs
    const hydratedMessages = messages.map((msg: any, idx: number) => ({
      message: msg,
      fileItems: messageFileItemsByMessage[idx].map((fi: any) => fi.id)
    }))
    // Chat files
    const chatFilesRes = await getFilesByChatId(chatId)
    const chatFiles = chatFilesRes.map((f: any) => ({ id: f.id, name: f.name, type: f.type, file: null }))

    return NextResponse.json({ chat, assistantTools, messages: hydratedMessages, chatFileItems, chatFiles })
  } catch (err: any) {
    console.error('[chat-data] error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}