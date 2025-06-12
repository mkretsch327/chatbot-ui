// @ts-nocheck
import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"

export async function getCollectionById(
  collectionId: string
): Promise<Tables<"collections">> {
  const result = await pool.query(
    `SELECT * FROM collections WHERE id = $1 LIMIT 1`,
    [collectionId]
  )
  if (result.rows.length === 0) {
    throw new Error("Collection not found")
  }
  return result.rows[0]
}

export async function getCollectionsByWorkspaceId(
  workspaceId: string
): Promise<Tables<"collections">[]> {
  const result = await pool.query(
    `SELECT c.* FROM collections c
      JOIN collection_workspaces cw ON cw.collection_id = c.id
      WHERE cw.workspace_id = $1`,
    [workspaceId]
  )
  return result.rows
}

export async function getWorkspacesByCollectionId(
  collectionId: string
): Promise<Tables<"workspaces">[]> {
  const result = await pool.query(
    `SELECT w.* FROM workspaces w
      JOIN collection_workspaces cw ON cw.workspace_id = w.id
      WHERE cw.collection_id = $1`,
    [collectionId]
  )
  return result.rows
}

export async function createCollection(
  collection: TablesInsert<"collections">,
  workspace_id: string
): Promise<Tables<"collections">> {
  const createdCollection = await insertRow<Tables<"collections">>(
    "collections",
    collection
  )
  await pool.query(
    `INSERT INTO collection_workspaces (user_id, collection_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [(createdCollection as any).user_id, createdCollection.id, workspace_id]
  )
  return createdCollection
}

export async function createCollections(
  collections: TablesInsert<"collections">[],
  workspace_id: string
): Promise<Tables<"collections">[]> {
  const created: Tables<"collections">[] = []
  for (const c of collections) {
    created.push(await createCollection(c, workspace_id))
  }
  return created
}

export async function createCollectionWorkspace(
  user_id: string,
  collection_id: string,
  workspace_id: string
): Promise<void> {
  await pool.query(
    `INSERT INTO collection_workspaces (user_id, collection_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [user_id, collection_id, workspace_id]
  )
}

export async function createCollectionWorkspaces(
  items: { user_id: string; collection_id: string; workspace_id: string }[]
): Promise<void> {
  for (const it of items) {
    await createCollectionWorkspace(
      it.user_id,
      it.collection_id,
      it.workspace_id
    )
  }
}

export async function updateCollection(
  collectionId: string,
  collection: TablesUpdate<"collections">
): Promise<Tables<"collections">> {
  return updateRow<Tables<"collections">>(
    "collections",
    collectionId,
    collection
  )
}

export async function deleteCollection(collectionId: string): Promise<void> {
  await deleteRow("collections", collectionId)
}

export async function deleteCollectionWorkspace(
  collectionId: string,
  workspaceId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM collection_workspaces WHERE collection_id = $1 AND workspace_id = $2`,
    [collectionId, workspaceId]
  )
}
