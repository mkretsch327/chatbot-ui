import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"
import { insertRow, updateRow, deleteRow } from "./index"

export async function getModelById(modelId: string): Promise<Tables<"models">> {
  const result = await pool.query(
    `SELECT * FROM models WHERE id = $1 LIMIT 1`,
    [modelId]
  )
  if (result.rows.length === 0) {
    throw new Error("Model not found")
  }
  return result.rows[0]
}

export async function getModelsByWorkspaceId(
  workspaceId: string
): Promise<Tables<"models">[]> {
  const result = await pool.query(
    `SELECT m.* FROM models m
      JOIN model_workspaces mw ON mw.model_id = m.id
      WHERE mw.workspace_id = $1`,
    [workspaceId]
  )
  return result.rows
}

export async function getWorkspacesByModelId(
  modelId: string
): Promise<Tables<"workspaces">[]> {
  const result = await pool.query(
    `SELECT w.* FROM workspaces w
      JOIN model_workspaces mw ON mw.workspace_id = w.id
      WHERE mw.model_id = $1`,
    [modelId]
  )
  return result.rows
}

export async function createModel(
  model: TablesInsert<"models">,
  workspace_id: string
): Promise<Tables<"models">> {
  const created = await insertRow<Tables<"models">>("models", model)
  await pool.query(
    `INSERT INTO model_workspaces (user_id, model_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [(created as any).user_id, created.id, workspace_id]
  )
  return created
}

export async function createModels(
  modelsArr: TablesInsert<"models">[],
  workspace_id: string
): Promise<Tables<"models">[]> {
  const created: Tables<"models">[] = []
  for (const m of modelsArr) {
    created.push(await createModel(m, workspace_id))
  }
  return created
}

export async function createModelWorkspace(
  user_id: string,
  model_id: string,
  workspace_id: string
): Promise<void> {
  await pool.query(
    `INSERT INTO model_workspaces (user_id, model_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [user_id, model_id, workspace_id]
  )
}

export async function createModelWorkspaces(
  items: { user_id: string; model_id: string; workspace_id: string }[]
): Promise<void> {
  for (const it of items) {
    await createModelWorkspace(it.user_id, it.model_id, it.workspace_id)
  }
}

export async function updateModel(
  modelId: string,
  model: TablesUpdate<"models">
): Promise<Tables<"models">> {
  return updateRow<Tables<"models">>("models", modelId, model)
}

export async function deleteModel(modelId: string): Promise<void> {
  await deleteRow("models", modelId)
}

export async function deleteModelWorkspace(
  modelId: string,
  workspaceId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM model_workspaces WHERE model_id = $1 AND workspace_id = $2`,
    [modelId, workspaceId]
  )
}
