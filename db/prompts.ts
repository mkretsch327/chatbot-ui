import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"
import { insertRow, updateRow, deleteRow } from "./index"

export async function getPromptById(
  promptId: string
): Promise<Tables<"prompts">> {
  const result = await pool.query(
    `SELECT * FROM prompts WHERE id = $1 LIMIT 1`,
    [promptId]
  )
  if (result.rows.length === 0) {
    throw new Error("Prompt not found")
  }
  return result.rows[0]
}

export async function getPromptsByWorkspaceId(
  workspaceId: string
): Promise<Tables<"prompts">[]> {
  const result = await pool.query(
    `SELECT p.* FROM prompts p
      JOIN prompt_workspaces pw ON pw.prompt_id = p.id
      WHERE pw.workspace_id = $1`,
    [workspaceId]
  )
  return result.rows
}

export async function getWorkspacesByPromptId(
  promptId: string
): Promise<Tables<"workspaces">[]> {
  const result = await pool.query(
    `SELECT w.* FROM workspaces w
      JOIN prompt_workspaces pw ON pw.workspace_id = w.id
      WHERE pw.prompt_id = $1`,
    [promptId]
  )
  return result.rows
}

export async function createPrompt(
  prompt: TablesInsert<"prompts">,
  workspace_id: string
): Promise<Tables<"prompts">> {
  const created = await insertRow<Tables<"prompts">>("prompts", prompt)
  await pool.query(
    `INSERT INTO prompt_workspaces (user_id, prompt_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [(created as any).user_id, created.id, workspace_id]
  )
  return created
}

export async function createPrompts(
  promptsArr: TablesInsert<"prompts">[],
  workspace_id: string
): Promise<Tables<"prompts">[]> {
  const created: Tables<"prompts">[] = []
  for (const pr of promptsArr) {
    created.push(await createPrompt(pr, workspace_id))
  }
  return created
}

export async function createPromptWorkspace(
  user_id: string,
  prompt_id: string,
  workspace_id: string
): Promise<void> {
  await pool.query(
    `INSERT INTO prompt_workspaces (user_id, prompt_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [user_id, prompt_id, workspace_id]
  )
}

export async function createPromptWorkspaces(
  items: { user_id: string; prompt_id: string; workspace_id: string }[]
): Promise<void> {
  for (const it of items) {
    await createPromptWorkspace(it.user_id, it.prompt_id, it.workspace_id)
  }
}

export async function updatePrompt(
  promptId: string,
  prompt: TablesUpdate<"prompts">
): Promise<Tables<"prompts">> {
  return updateRow<Tables<"prompts">>("prompts", promptId, prompt)
}

export async function deletePrompt(promptId: string): Promise<void> {
  await deleteRow("prompts", promptId)
}

export async function deletePromptWorkspace(
  promptId: string,
  workspaceId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM prompt_workspaces WHERE prompt_id = $1 AND workspace_id = $2`,
    [promptId, workspaceId]
  )
}
