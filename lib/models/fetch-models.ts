import { Tables } from "@/db/types"
import { LLM, LLMID, OpenRouterLLM } from "@/types"
import { toast } from "sonner"
import { LLM_LIST_MAP } from "./llm/llm-list"

export const fetchHostedModels = async (profile: Tables<"profiles">) => {
  try {
    const providers = ["google", "anthropic", "mistral", "groq", "perplexity"]

    if (profile.use_azure_openai) {
      providers.push("azure")
    } else {
      providers.push("openai")
    }

    const response = await fetch("/api/keys")

    if (!response.ok) {
      throw new Error(`Server is not responding.`)
    }

    const data = await response.json()

    let modelsToAdd: LLM[] = []

    // For each provider, if a key is set, add its models
    for (const provider of providers) {
      // Determine the corresponding profile key
      let providerKey: keyof typeof profile
      if (provider === "google") providerKey = "google_gemini_api_key"
      else if (provider === "azure") providerKey = "azure_openai_api_key"
      else providerKey = `${provider}_api_key` as keyof typeof profile

      // Skip if no key for this provider
      if (!profile?.[providerKey] && !data.isUsingEnvKeyMap[provider]) continue

      // Dynamic OpenAI/Azure list via server-side endpoint
      if (provider === 'openai' || provider === 'azure') {
        try {
          const resp = await fetch('/api/openai-models')
          if (resp.ok) {
            const dyn: LLM[] = await resp.json()
            modelsToAdd.push(...dyn)
          }
        } catch (e) {
          console.warn('Failed to fetch OpenAI models dynamically', e)
        }
      } else {
        // Static list for other providers
        const staticList = LLM_LIST_MAP[provider]
        if (Array.isArray(staticList)) modelsToAdd.push(...staticList)
      }
    }

    return {
      envKeyMap: data.isUsingEnvKeyMap,
      hostedModels: modelsToAdd
    }
  } catch (error) {
    console.warn("Error fetching hosted models: " + error)
  }
}

export const fetchOllamaModels = async () => {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_OLLAMA_URL + "/api/tags"
    )

    if (!response.ok) {
      throw new Error(`Ollama server is not responding.`)
    }

    const data = await response.json()

    const localModels: LLM[] = data.models.map((model: any) => ({
      modelId: model.name as LLMID,
      modelName: model.name,
      provider: "ollama",
      hostedId: model.name,
      platformLink: "https://ollama.ai/library",
      imageInput: false
    }))

    return localModels
  } catch (error) {
    console.warn("Error fetching Ollama models: " + error)
  }
}

export const fetchOpenRouterModels = async () => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models")

    if (!response.ok) {
      throw new Error(`OpenRouter server is not responding.`)
    }

    const { data } = await response.json()

    const openRouterModels = data.map(
      (model: {
        id: string
        name: string
        context_length: number
      }): OpenRouterLLM => ({
        modelId: model.id as LLMID,
        modelName: model.id,
        provider: "openrouter",
        hostedId: model.name,
        platformLink: "https://openrouter.dev",
        imageInput: false,
        maxContext: model.context_length
      })
    )

    return openRouterModels
  } catch (error) {
    console.error("Error fetching Open Router models: " + error)
    toast.error("Error fetching Open Router models: " + error)
  }
}
