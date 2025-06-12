import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"

export async function getMessageById(
  messageId: string
): Promise<Tables<"messages">> {
  const result = await pool.query(
    `SELECT * FROM messages WHERE id = $1 LIMIT 1`,
    [messageId]
  )
  if (result.rows.length === 0) {
    throw new Error("Message not found")
  }
  return result.rows[0]
}

export async function getMessagesByChatId(
  chatId: string
): Promise<Tables<"messages">[]> {
  const result = await pool.query(
    `SELECT * FROM messages WHERE chat_id = $1 ORDER BY sequence_number ASC`,
    [chatId]
  )
  return result.rows
}

export async function createMessage(
  message: TablesInsert<"messages">)
): Promise<Tables<"messages">> {
  const columns = Object.keys(message)
  const values = Object.values(message)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO messages (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const result = await pool.query(sql, values)
  return result.rows[0]
}

export async function createMessages(
  messages: TablesInsert<"messages">[]
): Promise<Tables<"messages">[]> {
  const created: Tables<"messages">[] = []
  for (const msg of messages) {
    created.push(await createMessage(msg))
  }
  return created
}

export async function updateMessage(
  messageId: string,
  message: TablesUpdate<"messages">
): Promise<Tables<"messages">> {
  const fields = { ...message } as Record<string, any>
  const columns = Object.keys(fields)
  const values = Object.values(fields)
  if (columns.length === 0) {
    return getMessageById(messageId)
  }
  const setClauses = columns.map((col, i) => `${col} = $${i + 1}`)
  const sql = `
    UPDATE messages
    SET ${setClauses.join(",")}
    WHERE id = $${columns.length + 1}
    RETURNING *
  `
  const result = await pool.query(sql, [...values, messageId])
  return result.rows[0]
}

export async function deleteMessage(messageId: string): Promise<void> {
  await pool.query(`DELETE FROM messages WHERE id = $1`, [messageId])
}

export async function deleteMessagesIncludingAndAfter(
  chatId: string,
  sequenceNumber: number
): Promise<void> {
  await pool.query(
    `DELETE FROM messages WHERE chat_id = $1 AND sequence_number >= $2`,
    [chatId, sequenceNumber]
  )
}
