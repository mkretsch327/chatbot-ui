import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"
import { insertRow, updateRow, deleteRow } from "./index"

export async function getToolById(toolId: string): Promise<Tables<"tools">> {
  const result = await pool.query(`SELECT * FROM tools WHERE id = $1 LIMIT 1`, [
    toolId
  ])
  if (result.rows.length === 0) {
    throw new Error("Tool not found")
  }
  return result.rows[0]
}

export async function getToolsByWorkspaceId(
  workspaceId: string
): Promise<Tables<"tools">[]> {
  const result = await pool.query(
    `SELECT t.* FROM tools t
      JOIN tool_workspaces tw ON tw.tool_id = t.id
      WHERE tw.workspace_id = $1`,
    [workspaceId]
  )
  return result.rows
}

export async function getWorkspacesByToolId(
  toolId: string
): Promise<Tables<"workspaces">[]> {
  const result = await pool.query(
    `SELECT w.* FROM workspaces w
      JOIN tool_workspaces tw ON tw.workspace_id = w.id
      WHERE tw.tool_id = $1`,
    [toolId]
  )
  return result.rows
}

export async function createTool(
  tool: TablesInsert<"tools">,
  workspace_id: string
): Promise<Tables<"tools">> {
  const created = await insertRow<Tables<"tools">>("tools", tool)
  await pool.query(
    `INSERT INTO tool_workspaces (user_id, tool_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [(created as any).user_id, created.id, workspace_id]
  )
  return created
}

export async function createTools(
  toolsArr: TablesInsert<"tools">[],
  workspace_id: string
): Promise<Tables<"tools">[]> {
  const created: Tables<"tools">[] = []
  for (const t of toolsArr) {
    created.push(await createTool(t, workspace_id))
  }
  return created
}

export async function createToolWorkspace(
  user_id: string,
  tool_id: string,
  workspace_id: string
): Promise<void> {
  await pool.query(
    `INSERT INTO tool_workspaces (user_id, tool_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [user_id, tool_id, workspace_id]
  )
}

export async function createToolWorkspaces(
  items: { user_id: string; tool_id: string; workspace_id: string }[]
): Promise<void> {
  for (const it of items) {
    await createToolWorkspace(it.user_id, it.tool_id, it.workspace_id)
  }
}

export async function updateTool(
  toolId: string,
  tool: TablesUpdate<"tools">
): Promise<Tables<"tools">> {
  return updateRow<Tables<"tools">>("tools", toolId, tool)
}

export async function deleteTool(toolId: string): Promise<void> {
  await deleteRow("tools", toolId)
}

export async function deleteToolWorkspace(
  toolId: string,
  workspaceId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM tool_workspaces WHERE tool_id = $1 AND workspace_id = $2`,
    [toolId, workspaceId]
  )
}
