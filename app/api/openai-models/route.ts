// app/api/openai-models/route.ts
import { NextResponse } from 'next/server'
import { getServerProfile, checkApiKey } from '@/lib/server/server-chat-helpers'
import OpenAI from 'openai'
import { LLM, LLMID } from '@/types'

export const runtime = 'nodejs'

/**
 * GET /api/openai-models
 * Dynamically fetch available OpenAI models using the configured API key.
 */
export async function GET() {
  try {
    const profile = await getServerProfile()
    checkApiKey(profile.openai_api_key, 'OpenAI')

    const client = new OpenAI({
      apiKey: profile.openai_api_key || '',
      organization: profile.openai_organization_id
    })
    // Collect all models (the SDK paginator is async-iterable)
    const allModels: any[] = []
    for await (const m of client.models.list()) {
      allModels.push(m)
    }
    const models: LLM[] = allModels.map(m => ({
      modelId: m.id as LLMID,
      modelName: m.id,
      provider: 'openai',
      hostedId: m.id,
      platformLink: `https://platform.openai.com/models/${m.id}`,
      imageInput: /vision|vision-preview|gpt-4o/.test(m.id)
    }))
    return NextResponse.json(models)
  } catch (error: any) {
    console.error('[openai-models] error:', error)
    return NextResponse.json({ error: error.message || 'Error fetching models' }, { status: 500 })
  }
}
