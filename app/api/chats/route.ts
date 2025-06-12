import { NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server/server-chat-helpers'
import { getChatsByWorkspaceId, createChat, updateChat } from '@/db/chats'

export const runtime = 'nodejs'

/**
 * GET /api/chats?workspaceId=...
 * Returns all chats in a workspace.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')
  if (!workspaceId) {
    return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
  }
  const chats = await getChatsByWorkspaceId(workspaceId)
  return NextResponse.json(chats)
}

/**
 * POST /api/chats
 * Creates a new chat record.
 */
export async function POST(request: Request) {
  const profile = await getServerProfile()
  const data = await request.json()
  // Generate default chat name if not provided
  const defaultName = data.name || `Chat ${new Date().toLocaleString()}`
  const chat = await createChat({
    user_id: profile.user_id,
    workspace_id: data.workspace_id,
    name: defaultName,
    model: data.model,
    prompt: data.prompt,
    temperature: data.temperature,
    context_length: data.context_length,
    include_profile_context: data.include_profile_context,
    include_workspace_instructions: data.include_workspace_instructions,
    embeddings_provider: data.embeddings_provider
  })
  return NextResponse.json(chat)
}
// Update chat (e.g. rename)
export async function PUT(request: Request) {
  const data = await request.json()
  const { id, ...updates } = data
  // Only allow updating name
  const updated = await updateChat(id, { name: updates.name })
  return NextResponse.json(updated)
}