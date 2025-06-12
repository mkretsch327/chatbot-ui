import { NextResponse } from 'next/server'
import { getCollectionFilesByCollectionId } from '@/db/collection-files'

export const runtime = 'nodejs'

/**
 * GET /api/collection-files?collectionId=...
 * Returns files in a given collection.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get('collectionId')
    if (!collectionId) {
      return NextResponse.json({ error: 'Missing collectionId' }, { status: 400 })
    }
    const { files } = await getCollectionFilesByCollectionId(collectionId)
    return NextResponse.json({ files })
  } catch (err: any) {
    console.error('[collection-files] error:', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}