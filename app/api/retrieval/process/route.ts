import fs from "fs/promises"
import path from "path"
import { generateLocalEmbedding } from "@/lib/generate-local-embedding"
import {
  processCSV,
  processJSON,
  processMarkdown,
  processPdf,
  processTxt
} from "@/lib/retrieval/processing"
import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import OpenAI from "openai"
import { FileItemChunk } from "@/types"
import { getFileById } from "@/db/files"
import { pool } from "@/db/client"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const profile = await getServerProfile()

    const profile = await getServerProfile()

    const formData = await req.formData()

    const file_id = formData.get("file_id") as string
    const embeddingsProvider = formData.get("embeddingsProvider") as string

    const fileMetadata = await getFileById(file_id)

    if (metadataError) {
      throw new Error(
        `Failed to retrieve file metadata: ${metadataError.message}`
      )
    }

    if (!fileMetadata) {
      throw new Error("File not found")
    }

    if (fileMetadata.user_id !== profile.user_id) {
      return new NextResponse("Unauthorized", { status: 403 })
    }

    // Read file from local storage
    const diskPath = path.join(
      process.cwd(),
      "public",
      "files",
      fileMetadata.file_path
    )
    const fileBuffer = await fs.readFile(diskPath)
    const blob = new Blob([fileBuffer])
    const fileExtension = fileMetadata.name.split(".").pop()?.toLowerCase()

    if (embeddingsProvider === "openai") {
      try {
        if (profile.use_azure_openai) {
          checkApiKey(profile.azure_openai_api_key, "Azure OpenAI")
        } else {
          checkApiKey(profile.openai_api_key, "OpenAI")
        }
      } catch (error: any) {
        error.message =
          error.message +
          ", make sure it is configured or else use local embeddings"
        throw error
      }
    }

    let chunks: FileItemChunk[] = []

    switch (fileExtension) {
      case "csv":
        chunks = await processCSV(blob)
        break
      case "json":
        chunks = await processJSON(blob)
        break
      case "md":
        chunks = await processMarkdown(blob)
        break
      case "pdf":
        chunks = await processPdf(blob)
        break
      case "txt":
        chunks = await processTxt(blob)
        break
      default:
        return new NextResponse("Unsupported file type", {
          status: 400
        })
    }

    let embeddings: any = []

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
        input: chunks.map(chunk => chunk.content)
      })

      embeddings = response.data.map((item: any) => {
        return item.embedding
      })
    } else if (embeddingsProvider === "local") {
      const embeddingPromises = chunks.map(async chunk => {
        try {
          return await generateLocalEmbedding(chunk.content)
        } catch (error) {
          console.error(`Error generating embedding for chunk: ${chunk}`, error)

          return null
        }
      })

      embeddings = await Promise.all(embeddingPromises)
    }

    const file_items = chunks.map((chunk, index) => ({
      file_id,
      user_id: profile.user_id,
      content: chunk.content,
      tokens: chunk.tokens,
      openai_embedding:
        embeddingsProvider === "openai"
          ? ((embeddings[index] || null) as any)
          : null,
      local_embedding:
        embeddingsProvider === "local"
          ? ((embeddings[index] || null) as any)
          : null
    }))

    // Store file item embeddings in local DB
    await pool.query("DELETE FROM file_items WHERE file_id = $1", [file_id])
    for (const item of file_items) {
      const cols = ["file_id", "user_id", "content", "tokens"]
      const vals = [item.file_id, item.user_id, item.content, item.tokens]
      const placeholders = vals.map((_, i) => `$${i + 1}`)
      // embeddings
      if (embeddingsProvider === "openai") {
        cols.push("openai_embedding")
        vals.push(item.openai_embedding)
        placeholders.push(`$${placeholders.length + 1}`)
      } else if (embeddingsProvider === "local") {
        cols.push("local_embedding")
        vals.push(item.local_embedding)
        placeholders.push(`$${placeholders.length + 1}`)
      }
      const sql = `INSERT INTO file_items (${cols.join(",")}) VALUES (${placeholders.join(",")})`
      await pool.query(sql, vals)
    }
    const totalTokens = file_items.reduce((acc, itm) => acc + itm.tokens, 0)
    await pool.query("UPDATE files SET tokens = $1 WHERE id = $2", [
      totalTokens,
      file_id
    ])

    return new NextResponse("Embed Successful", {
      status: 200
    })
  } catch (error: any) {
    console.log(`Error in retrieval/process: ${error.stack}`)
    const errorMessage = error?.message || "An unexpected error occurred"
    const errorCode = error.status || 500
    return new Response(JSON.stringify({ message: errorMessage }), {
      status: errorCode
    })
  }
}
