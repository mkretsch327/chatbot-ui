import { pool } from "@/db/client"
import { TablesInsert, Tables } from "@/db/types"

export async function getToolsByAssistantId(
  assistantId: string
): Promise<Tables<"tools">[]> {
  const result = await pool.query(
    `SELECT t.* FROM tools t
      JOIN assistant_tools at ON at.tool_id = t.id
      WHERE at.assistant_id = $1`,
    [assistantId]
  )
  return result.rows
}

export async function createAssistantTool(
  assistantTool: TablesInsert<"assistant_tools">
): Promise<Tables<"assistant_tools">> {
  const columns = Object.keys(assistantTool)
  const values = Object.values(assistantTool)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO assistant_tools (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const res = await pool.query(sql, values)
  return res.rows[0]
}

export async function createAssistantTools(
  assistantTools: TablesInsert<"assistant_tools">[]
): Promise<Tables<"assistant_tools">[]> {
  const created: Tables<"assistant_tools">[] = []
  for (const at of assistantTools) {
    created.push(await createAssistantTool(at))
  }
  return created
}

export async function deleteAssistantTool(
  assistantId: string,
  toolId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM assistant_tools WHERE assistant_id = $1 AND tool_id = $2`,
    [assistantId, toolId]
  )
}
