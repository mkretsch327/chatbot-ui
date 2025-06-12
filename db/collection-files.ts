import { pool } from "@/db/client"
import { TablesInsert, Tables } from "@/db/types"

export async function getCollectionFilesByCollectionId(
  collectionId: string
): Promise<{ files: Tables<"files">[] }> {
  const result = await pool.query(
    `SELECT f.* FROM files f
      JOIN collection_files cf ON cf.file_id = f.id
      WHERE cf.collection_id = $1`,
    [collectionId]
  )
  return { files: result.rows }
}

export async function createCollectionFile(
  collectionFile: TablesInsert<"collection_files">
): Promise<Tables<"collection_files">> {
  const columns = Object.keys(collectionFile)
  const values = Object.values(collectionFile)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO collection_files (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const res = await pool.query(sql, values)
  return res.rows[0]
}

export async function createCollectionFiles(
  collectionFiles: TablesInsert<"collection_files">[]
): Promise<Tables<"collection_files">[]> {
  const created = [] as Tables<"collection_files">[]
  for (const cf of collectionFiles) {
    created.push(await createCollectionFile(cf))
  }
  return created
}

export async function deleteCollectionFile(
  collectionId: string,
  fileId: string
): Promise<void> {
  await pool.query(
    `DELETE FROM collection_files WHERE collection_id = $1 AND file_id = $2`,
    [collectionId, fileId]
  )
}
