import { NextResponse } from 'next/server'
import { getServerProfile } from '@/lib/server/server-chat-helpers'
import { createMessage } from '@/db/messages'

export const runtime = 'nodejs'

/**
 * POST /api/messages
 * Creates a new message record in the database.
 */
export async function POST(request: Request) {
  const data = await request.json()
  const profile = await getServerProfile()
  const { chat_id, content, role, sequence_number, model } = data
  const msg = await createMessage({
    user_id: profile.user_id,
    chat_id,
    content,
    role,
    model,
    sequence_number
  })
  return NextResponse.json(msg)
}