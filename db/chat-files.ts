import { pool } from "@/db/client"
import { TablesInsert, Tables } from "@/db/types"

export async function getFilesByChatId(
  chatId: string
): Promise<Tables<"files">[]> {
  const result = await pool.query(
    `SELECT f.* FROM files f
      JOIN chat_files cf ON cf.file_id = f.id
      WHERE cf.chat_id = $1`,
    [chatId]
  )
  return result.rows
}

export async function createChatFile(
  chatFile: TablesInsert<"chat_files">)
): Promise<Tables<"chat_files">> {
  const columns = Object.keys(chatFile)
  const values = Object.values(chatFile)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO chat_files (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const res = await pool.query(sql, values)
  return res.rows[0]
}

export async function createChatFiles(
  chatFiles: TablesInsert<"chat_files">[]
): Promise<Tables<"chat_files">[]> {
  const created: Tables<"chat_files">[] = []
  for (const cf of chatFiles) {
    created.push(await createChatFile(cf))
  }
  return created
}
