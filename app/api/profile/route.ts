import { NextResponse } from 'next/server'
import { getProfile, createProfile, updateProfile } from '@/db/profile'

export async function GET() {
  try {
    const profile = await getProfile()
    return NextResponse.json(profile)
  } catch (e) {
    return NextResponse.json(null, { status: 404 })
  }
}

export async function POST(request: Request) {
  const data = await request.json()
  const profile = await createProfile(data)
  return NextResponse.json(profile)
}

export async function PUT(request: Request) {
  const data = await request.json()
  const { id, ...updates } = data
  const profile = await updateProfile(id, updates)
  return NextResponse.json(profile)
}