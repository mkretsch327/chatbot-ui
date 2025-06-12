import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"
import { insertRow, updateRow, deleteRow } from "./index"

export async function getPresetById(
  presetId: string
): Promise<Tables<"presets">> {
  const result = await pool.query(
    `SELECT * FROM presets WHERE id = $1 LIMIT 1`,
    [presetId]
  )
  if (result.rows.length === 0) {
    throw new Error("Preset not found")
  }
  return result.rows[0]
}

export async function getPresetsByWorkspaceId(
  workspaceId: string
): Promise<Tables<"presets">[]> {
  const result = await pool.query(
    `SELECT p.* FROM presets p
      JOIN preset_workspaces pw ON pw.preset_id = p.id
      WHERE pw.workspace_id = $1`,
    [workspaceId]
  )
  return result.rows
}

export async function getWorkspacesByPresetId(
  presetId: string
): Promise<Tables<"workspaces">[]> {
  const result = await pool.query(
    `SELECT w.* FROM workspaces w
      JOIN preset_workspaces pw ON pw.workspace_id = w.id
      WHERE pw.preset_id = $1`,
    [presetId]
  )
  return result.rows
}

export async function createPreset(
  preset: TablesInsert<"presets">,
  workspace_id: string
): Promise<Tables<"presets">> {
  const created = await insertRow<Tables<"presets">>("presets", preset)
  await pool.query(
    `INSERT INTO preset_workspaces (user_id, preset_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [(created as any).user_id, created.id, workspace_id]
  )
  return created
}

export async function createPresets(
  presetsArr: TablesInsert<"presets">[],
  workspace_id: string
): Promise<Tables<"presets">[]> {
  const created: Tables<"presets">[] = []
  for (const pr of presetsArr) {
    created.push(await createPreset(pr, workspace_id))
  }
  return created
}

export async function createPresetWorkspace(
  user_id: string,
  preset_id: string,
  workspace_id: string
): Promise<void> {
  await pool.query(
    `INSERT INTO preset_workspaces (user_id, preset_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [user_id, preset_id, workspace_id]
  )
}

export async function createPresetWorkspaces(
  items: { user_id: string; preset_id: string; workspace_id: string }[]
): Promise<void> {
  for (const it of items) {
    await createPresetWorkspace(it.user_id, it.preset_id, it.workspace_id)
  }
}

export async function updatePreset(
  presetId: string,
  preset: TablesUpdate<"presets">
): Promise<Tables<"presets">> {
  return updateRow<Tables<"presets">>("presets", presetId, preset)
}

export async function deletePreset(presetId: string): Promise<void> {
  await deleteRow("presets", presetId)
}

export async function deletePresetWorkspace(
  presetId: string,
  workspaceId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM preset_workspaces WHERE preset_id = $1 AND workspace_id = $2`,
    [presetId, workspaceId]
  )
}
