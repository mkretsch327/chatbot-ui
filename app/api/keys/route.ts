import { NextResponse } from 'next/server'
import { VALID_ENV_KEYS } from '@/types/valid-keys'

// Returns which providers have API keys set via environment variables
export async function GET() {
  const providers = [
    'openai',
    'azure',
    'google',
    'anthropic',
    'mistral',
    'groq',
    'perplexity',
    'openrouter'
  ]
  const keyEnvMap: Record<string, VALID_ENV_KEYS> = {
    openai: VALID_ENV_KEYS.OPENAI_API_KEY,
    azure: VALID_ENV_KEYS.AZURE_OPENAI_API_KEY,
    google: VALID_ENV_KEYS.GOOGLE_GEMINI_API_KEY,
    anthropic: VALID_ENV_KEYS.ANTHROPIC_API_KEY,
    mistral: VALID_ENV_KEYS.MISTRAL_API_KEY,
    groq: VALID_ENV_KEYS.GROQ_API_KEY,
    perplexity: VALID_ENV_KEYS.PERPLEXITY_API_KEY,
    openrouter: VALID_ENV_KEYS.OPENROUTER_API_KEY
  }
  const isUsingEnvKeyMap: Record<string, boolean> = {}
  for (const provider of providers) {
    const envKey = keyEnvMap[provider]
    isUsingEnvKeyMap[provider] = !!process.env[envKey]
  }
  return NextResponse.json({ isUsingEnvKeyMap })
}