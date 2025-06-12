import { pool } from "@/db/client"
import { TablesInsert, Tables } from "@/db/types"

export async function getCollectionsByAssistantId(
  assistantId: string
): Promise<Tables<"collections">[]> {
  const result = await pool.query(
    `SELECT c.* FROM collections c
      JOIN assistant_collections ac ON ac.collection_id = c.id
      WHERE ac.assistant_id = $1`,
    [assistantId]
  )
  return result.rows
}

export async function createAssistantCollection(
  assistantCollection: TablesInsert<"assistant_collections">
): Promise<Tables<"assistant_collections">> {
  const columns = Object.keys(assistantCollection)
  const values = Object.values(assistantCollection)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO assistant_collections (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const res = await pool.query(sql, values)
  return res.rows[0]
}

export async function createAssistantCollections(
  assistantCollections: TablesInsert<"assistant_collections">[]
): Promise<Tables<"assistant_collections">[]> {
  const created: Tables<"assistant_collections">[] = []
  for (const ac of assistantCollections) {
    created.push(await createAssistantCollection(ac))
  }
  return created
}

export async function deleteAssistantCollection(
  assistantId: string,
  collectionId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM assistant_collections WHERE assistant_id = $1 AND collection_id = $2`,
    [assistantId, collectionId]
  )
}
