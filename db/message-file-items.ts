import { pool } from "@/db/client"
import { TablesInsert, Tables } from "@/db/types"

export async function getFileItemsByMessageId(
  messageId: string
): Promise<Tables<"file_items">[]> {
  const result = await pool.query(
    `SELECT fi.* FROM file_items fi
      JOIN message_file_items mfi ON mfi.file_item_id = fi.id
      WHERE mfi.message_id = $1`,
    [messageId]
  )
  return result.rows
}

export async function createMessageFileItems(
  mfi: TablesInsert<"message_file_items">[]
): Promise<Tables<"message_file_items">[]> {
  const created: Tables<"message_file_items">[] = []
  for (const item of mfi) {
    const columns = Object.keys(item)
    const values = Object.values(item)
    const placeholders = columns.map((_, i) => `$${i + 1}`)
    const sql = `
      INSERT INTO message_file_items (${columns.join(",")})
      VALUES (${placeholders.join(",")})
      RETURNING *
    `
    const res = await pool.query(sql, values)
    created.push(res.rows[0])
  }
  return created
}
