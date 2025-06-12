import { pool } from "@/db/client"
import { TablesInsert, Tables } from "@/db/types"

export async function getFilesByAssistantId(
  assistantId: string
): Promise<Tables<"files">[]> {
  const result = await pool.query(
    `SELECT f.* FROM files f
      JOIN assistant_files af ON af.file_id = f.id
      WHERE af.assistant_id = $1`,
    [assistantId]
  )
  return result.rows
}

export async function createAssistantFile(
  assistantFile: TablesInsert<"assistant_files">
): Promise<Tables<"assistant_files">> {
  const columns = Object.keys(assistantFile)
  const values = Object.values(assistantFile)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO assistant_files (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const res = await pool.query(sql, values)
  return res.rows[0]
}

export async function createAssistantFiles(
  assistantFiles: TablesInsert<"assistant_files">[]
): Promise<Tables<"assistant_files">[]> {
  const created: Tables<"assistant_files">[] = []
  for (const af of assistantFiles) {
    created.push(await createAssistantFile(af))
  }
  return created
}

export async function deleteAssistantFile(
  assistantId: string,
  fileId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM assistant_files WHERE assistant_id = $1 AND file_id = $2`,
    [assistantId, fileId]
  )
}
