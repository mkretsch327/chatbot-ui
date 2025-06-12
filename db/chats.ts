import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"

export async function getChatById(
  chatId: string
): Promise<Tables<"chats"> | null> {
  const result = await pool.query(`SELECT * FROM chats WHERE id = $1 LIMIT 1`, [
    chatId
  ])
  return result.rows[0] || null
}

export async function getChatsByWorkspaceId(
  workspaceId: string
): Promise<Tables<"chats">[]> {
  const result = await pool.query(
    `SELECT * FROM chats WHERE workspace_id = $1 ORDER BY created_at DESC`,
    [workspaceId]
  )
  return result.rows
}

export async function createChat(
  chat: TablesInsert<"chats">
): Promise<Tables<"chats">> {
  const columns = Object.keys(chat)
  const values = Object.values(chat)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO chats (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const result = await pool.query(sql, values)
  return result.rows[0]
}

export async function createChats(
  chats: TablesInsert<"chats">[]
): Promise<Tables<"chats">[]> {
  // Batch insert by creating each chat sequentially
  const created: Tables<"chats">[] = []
  for (const chat of chats) {
    created.push(await createChat(chat))
  }
  return created
}

export async function updateChat(
  chatId: string,
  chat: TablesUpdate<"chats">
): Promise<Tables<"chats">> {
  const fields = { ...chat } as Record<string, any>
  const columns = Object.keys(fields)
  const values = Object.values(fields)
  if (columns.length === 0) {
    return (await getChatById(chatId))!
  }
  const setClauses = columns.map((col, i) => `${col} = $${i + 1}`)
  const sql = `
    UPDATE chats
    SET ${setClauses.join(",")}
    WHERE id = $${columns.length + 1}
    RETURNING *
  `
  const result = await pool.query(sql, [...values, chatId])
  return result.rows[0]
}

export async function deleteChat(chatId: string): Promise<void> {
  await pool.query(`DELETE FROM chats WHERE id = $1`, [chatId])
}
