import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"

export async function getHomeWorkspace(): Promise<Tables<"workspaces">> {
  const result = await pool.query(
    `SELECT * FROM workspaces WHERE is_home = true LIMIT 1`
  )
  if (result.rows.length === 0) {
    throw new Error("Home workspace not found")
  }
  return result.rows[0]
}

export async function getWorkspaceById(
  workspaceId: string
): Promise<Tables<"workspaces">> {
  const result = await pool.query(
    `SELECT * FROM workspaces WHERE id = $1 LIMIT 1`,
    [workspaceId]
  )
  if (result.rows.length === 0) {
    throw new Error("Workspace not found")
  }
  return result.rows[0]
}

export async function getWorkspaces(): Promise<Tables<"workspaces">[]> {
  const result = await pool.query(
    `SELECT * FROM workspaces ORDER BY created_at DESC`
  )
  return result.rows
}

export async function createWorkspace(
  workspace: TablesInsert<"workspaces">
): Promise<Tables<"workspaces">> {
  const columns = Object.keys(workspace)
  const values = Object.values(workspace)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO workspaces (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const result = await pool.query(sql, values)
  return result.rows[0]
}

export async function updateWorkspace(
  workspaceId: string,
  workspace: TablesUpdate<"workspaces">
): Promise<Tables<"workspaces">> {
  const fields = { ...workspace } as Record<string, any>
  const columns = Object.keys(fields)
  const values = Object.values(fields)
  if (columns.length === 0) {
    return getWorkspaceById(workspaceId)
  }
  const setClauses = columns.map((col, i) => `${col} = $${i + 1}`)
  const sql = `
    UPDATE workspaces
    SET ${setClauses.join(",")}
    WHERE id = $${columns.length + 1}
    RETURNING *
  `
  const result = await pool.query(sql, [...values, workspaceId])
  if (result.rows.length === 0) {
    throw new Error("Workspace update failed")
  }
  return result.rows[0]
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await pool.query(`DELETE FROM workspaces WHERE id = $1`, [workspaceId])
}
