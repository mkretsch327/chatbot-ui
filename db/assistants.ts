import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"
import { insertRow, updateRow, deleteRow } from "./index"

export async function getAssistantById(
  assistantId: string
): Promise<Tables<"assistants">> {
  const result = await pool.query(
    `SELECT * FROM assistants WHERE id = $1 LIMIT 1`,
    [assistantId]
  )
  if (result.rows.length === 0) {
    throw new Error("Assistant not found")
  }
  return result.rows[0]
}

export async function getAssistantsByWorkspaceId(
  workspaceId: string
): Promise<Tables<"assistants">[]> {
  const result = await pool.query(
    `SELECT a.* FROM assistants a
      JOIN assistant_workspaces aw ON aw.assistant_id = a.id
      WHERE aw.workspace_id = $1`,
    [workspaceId]
  )
  return result.rows
}

export async function getWorkspacesByAssistantId(
  assistantId: string
): Promise<Tables<"workspaces">[]> {
  const result = await pool.query(
    `SELECT w.* FROM workspaces w
      JOIN assistant_workspaces aw ON aw.workspace_id = w.id
      WHERE aw.assistant_id = $1`,
    [assistantId]
  )
  return result.rows
}

export async function createAssistant(
  assistant: TablesInsert<"assistants">,
  workspace_id: string
): Promise<Tables<"assistants">> {
  const created = await insertRow<Tables<"assistants">>("assistants", assistant)
  await pool.query(
    `INSERT INTO assistant_workspaces (user_id, assistant_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [(created as any).user_id, created.id, workspace_id]
  )
  return created
}

export async function createAssistants(
  assistants: TablesInsert<"assistants">[],
  workspace_id: string
): Promise<Tables<"assistants">[]> {
  const created: Tables<"assistants">[] = []
  for (const ast of assistants) {
    created.push(await createAssistant(ast, workspace_id))
  }
  return created
}

export async function createAssistantWorkspace(
  user_id: string,
  assistant_id: string,
  workspace_id: string
): Promise<void> {
  await pool.query(
    `INSERT INTO assistant_workspaces (user_id, assistant_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [user_id, assistant_id, workspace_id]
  )
}

export async function createAssistantWorkspaces(
  items: { user_id: string; assistant_id: string; workspace_id: string }[]
): Promise<void> {
  for (const it of items) {
    await createAssistantWorkspace(it.user_id, it.assistant_id, it.workspace_id)
  }
}

export async function updateAssistant(
  assistantId: string,
  assistant: TablesUpdate<"assistants">
): Promise<Tables<"assistants">> {
  return updateRow<Tables<"assistants">>("assistants", assistantId, assistant)
}

export async function deleteAssistant(assistantId: string): Promise<void> {
  await deleteRow("assistants", assistantId)
}

export async function deleteAssistantWorkspace(
  assistantId: string,
  workspaceId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM assistant_workspaces WHERE assistant_id = $1 AND workspace_id = $2`,
    [assistantId, workspaceId]
  )
}
