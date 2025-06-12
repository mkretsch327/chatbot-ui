import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"
import { insertRow, updateRow, deleteRow } from "./index"

export async function getFoldersByWorkspaceId(
  workspaceId: string
): Promise<Tables<"folders">[]> {
  const result = await pool.query(
    `SELECT * FROM folders WHERE workspace_id = $1`,
    [workspaceId]
  )
  return result.rows
}

export async function createFolder(
  folder: TablesInsert<"folders">)
): Promise<Tables<"folders">> {
  const created = await insertRow<Tables<"folders">>(
    "folders",
    folder
  )
  return created
}

export async function updateFolder(
  folderId: string,
  folder: TablesUpdate<"folders">
): Promise<Tables<"folders">> {
  return updateRow<Tables<"folders">>(
    "folders",
    folderId,
    folder
  )
}

export async function deleteFolder(folderId: string): Promise<void> {
  await deleteRow("folders", folderId)
}
