import { NextResponse } from 'next/server'
import { getWorkspaces, createWorkspace } from '@/db/workspaces'

export async function GET() {
  const workspaces = await getWorkspaces()
  return NextResponse.json(workspaces)
}

export async function POST(request: Request) {
  const data = await request.json()
  const workspace = await createWorkspace(data)
  return NextResponse.json(workspace)
}