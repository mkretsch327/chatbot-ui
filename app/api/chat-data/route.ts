import { NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server/server-chat-helpers'
import { getChatById } from '@/db/chats'
import { getAssistantToolsByAssistantId } from '@/db/assistant-tools'
import { getMessagesByChatId } from '@/db/messages'
import { getMessageFileItemsByMessageId } from '@/db/message-file-items'
import { getChatFilesByChatId } from '@/db/chat-files'

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
      const toolsRes = await getAssistantToolsByAssistantId(chat.assistant_id)
      assistantTools = toolsRes.tools
    }
    // Messages
    const messages = await getMessagesByChatId(chatId)
    // Message-file relations
    const messageFileItemsPromises = messages.map(msg =>
      getMessageFileItemsByMessageId(msg.id)
    )
    const messageFileItems = await Promise.all(messageFileItemsPromises)
    // Chat files
    const chatFilesRes = await getChatFilesByChatId(chatId)
    const chatFiles = chatFilesRes.files.map((f: any) => ({ id: f.id, name: f.name, type: f.type, file: null }))

    return NextResponse.json({ chat, assistantTools, messages, messageFileItems, chatFiles })
  } catch (err: any) {
    console.error('[chat-data] error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}