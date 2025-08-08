// @ts-nocheck
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { ChatSettings } from "@/types"
import OpenAI from "openai"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const json = await request.json()
  const { chatSettings, messages } = json as {
    chatSettings: ChatSettings
    messages: any[]
  }

  try {
    const profile = await getServerProfile()

    checkApiKey(profile.openai_api_key, "OpenAI")

    // Stream via direct fetch to avoid SDK streaming differences
    const upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${profile.openai_api_key}`,
        ...(profile.openai_organization_id ? { 'OpenAI-Organization': profile.openai_organization_id } : {}),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: chatSettings.model,
        input: messages,
        stream: true
      })
    })

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => '')
      return new Response(JSON.stringify({ message: text || 'Upstream error from OpenAI' }), { status: upstream.status || 500 })
    }

    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive'
      }
    })
  } catch (error: any) {
    let errorMessage = error.message || "An unexpected error occurred"
    const errorCode = error.status || 500

    if (errorMessage.toLowerCase().includes("api key not found")) {
      errorMessage =
        "OpenAI API Key not found. Please set it in your profile settings."
    } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
      errorMessage =
        "OpenAI API Key is incorrect. Please fix it in your profile settings."
    }

    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
