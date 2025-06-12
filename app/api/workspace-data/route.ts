import { NextResponse } from 'next/server'
import { getWorkspaceById } from '@/db/workspaces'
import { getAssistantsByWorkspaceId } from '@/db/assistants'
import { getChatsByWorkspaceId } from '@/db/chats'
import { getCollectionsByWorkspaceId } from '@/db/collections'
import { getFoldersByWorkspaceId } from '@/db/folders'
import { getFilesByWorkspaceId } from '@/db/files'
import { getPresetsByWorkspaceId } from '@/db/presets'
import { getPromptsByWorkspaceId } from '@/db/prompts'
import { getToolsByWorkspaceId } from '@/db/tools'
import { getModelsByWorkspaceId } from '@/db/models'

/**
 * GET /api/workspace-data?workspaceId=...
 * Returns all the data needed for a workspace in one request.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json({ error: 'Missing workspaceId' }, { status: 400 })
    }
    const workspace = await getWorkspaceById(workspaceId)
    const assistants = await getAssistantsByWorkspaceId(workspaceId)
    const chats = await getChatsByWorkspaceId(workspaceId)
    const collections = await getCollectionsByWorkspaceId(workspaceId)
    const folders = await getFoldersByWorkspaceId(workspaceId)
    const files = await getFilesByWorkspaceId(workspaceId)
    const presets = await getPresetsByWorkspaceId(workspaceId)
    const prompts = await getPromptsByWorkspaceId(workspaceId)
    const tools = await getToolsByWorkspaceId(workspaceId)
    const models = await getModelsByWorkspaceId(workspaceId)

    return NextResponse.json({ workspace, assistants, chats, collections, folders, files, presets, prompts, tools, models })
  } catch (error: any) {
    console.error('[workspace-data] error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}