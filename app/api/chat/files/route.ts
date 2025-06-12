import { NextResponse } from 'next/server'
import { createFileBasedOnExtension } from '@/db/files'

export const runtime = 'nodejs'

/**
 * POST /api/chat/files
 * Handle file uploads for chat, create DB record, store file, process retrieval.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const metadataJson = formData.get('metadata') as string | null
    if (!file || !metadataJson) {
      return NextResponse.json({ error: 'Missing file or metadata' }, { status: 400 })
    }
    const metadata = JSON.parse(metadataJson)
    const {
      user_id,
      description,
      name,
      size,
      tokens,
      type,
      workspace_id,
      embeddingsProvider
    } = metadata
    const createdFile = await createFileBasedOnExtension(
      file,
      { user_id, description, file_path: '', name, size, tokens, type },
      workspace_id,
      embeddingsProvider
    )
    return NextResponse.json(createdFile)
  } catch (error: any) {
    console.error('[api/chat/files] error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}