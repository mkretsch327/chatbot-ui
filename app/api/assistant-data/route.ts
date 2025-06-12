import { NextResponse } from 'next/server'
import { getFilesByAssistantId } from '@/db/assistant-files'
import { getCollectionsByAssistantId } from '@/db/assistant-collections'
import { getToolsByAssistantId } from '@/db/assistant-tools'

export const runtime = 'nodejs'

/**
 * GET /api/assistant-data?assistantId=...
 * Returns all files, collections, and tools for a given assistant.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const assistantId = searchParams.get('assistantId')
    if (!assistantId) {
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 })
    }
    const files = await getFilesByAssistantId(assistantId)
    const collections = await getCollectionsByAssistantId(assistantId)
    const tools = await getToolsByAssistantId(assistantId)
    return NextResponse.json({ files, collections, tools })
  } catch (err: any) {
    console.error('[assistant-data] error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}