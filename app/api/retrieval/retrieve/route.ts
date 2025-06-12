import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import OpenAI from "openai"
import { pool } from "@/db/client"

export const runtime = "nodejs"
export async function POST(request: Request) {
  const json = await request.json()
  const { userInput, fileIds, embeddingsProvider, sourceCount } = json as {
    userInput: string
    fileIds: string[]
    embeddingsProvider: "openai" | "local"
    sourceCount: number
  }

  const uniqueFileIds = [...new Set(fileIds)]

  try {
    const profile = await getServerProfile()

    if (embeddingsProvider === "openai") {
      if (profile.use_azure_openai) {
        checkApiKey(profile.azure_openai_api_key, "Azure OpenAI")
      } else {
        checkApiKey(profile.openai_api_key, "OpenAI")
      }
    }

    let chunks: any[] = []

    let openai
    if (profile.use_azure_openai) {
      openai = new OpenAI({
        apiKey: profile.azure_openai_api_key || "",
        baseURL: `${profile.azure_openai_endpoint}/openai/deployments/${profile.azure_openai_embeddings_id}`,
        defaultQuery: { "api-version": "2023-12-01-preview" },
        defaultHeaders: { "api-key": profile.azure_openai_api_key }
      })
    } else {
      openai = new OpenAI({
        apiKey: profile.openai_api_key || "",
        organization: profile.openai_organization_id
      })
    }

    if (embeddingsProvider === "openai") {
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: userInput
      })

      const openaiEmbedding = response.data.map(item => item.embedding)[0]

      const result = await pool.query(
        `SELECT id, file_id, content, tokens,
          1 - (openai_embedding <=> $1) AS similarity
         FROM file_items
         WHERE file_id = ANY($2)
         ORDER BY openai_embedding <=> $1
         LIMIT $3`,
        [openaiEmbedding, uniqueFileIds, sourceCount]
      )
      chunks = result.rows
    } else if (embeddingsProvider === "local") {
      const localEmbedding = await generateLocalEmbedding(userInput)

      const localResult = await pool.query(
        `SELECT id, file_id, content, tokens,
          1 - (local_embedding <=> $1) AS similarity
         FROM file_items
         WHERE file_id = ANY($2)
         ORDER BY local_embedding <=> $1
         LIMIT $3`,
        [localEmbedding, uniqueFileIds, sourceCount]
      )
      chunks = localResult.rows
    }

    const mostSimilarChunks = chunks?.sort(
      (a, b) => b.similarity - a.similarity
    )

    return new Response(JSON.stringify({ results: mostSimilarChunks }), {
      status: 200
    })
  } catch (error: any) {
    const errorMessage = error.error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
