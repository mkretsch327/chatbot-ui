import { pool } from "./client"

/**
 * Fetch a single row by primary key
 */
export async function getById<T>(
  table: string,
  id: string,
  idKey = "id"
): Promise<T> {
  const result = await pool.query(
    `SELECT * FROM ${table} WHERE ${idKey} = $1 LIMIT 1`,
    [id]
  )
  if (result.rows.length === 0) {
    throw new Error(`${table} not found`)
  }
  return result.rows[0]
}

/**
 * Fetch multiple rows by a field
 */
export async function getAllByField<T>(
  table: string,
  field: string,
  value: any,
  orderBy?: string,
  ascending = true
): Promise<T[]> {
  let sql = `SELECT * FROM ${table} WHERE ${field} = $1`
  if (orderBy) {
    sql += ` ORDER BY ${orderBy} ${ascending ? "ASC" : "DESC"}`
  }
  const result = await pool.query(sql, [value])
  return result.rows
}

/**
 * Insert a single row
 */
export async function insertRow<T>(
  table: string,
  data: Partial<T>
): Promise<T> {
  const columns = Object.keys(data)
  const values = Object.values(data)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO ${table} (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const result = await pool.query(sql, values)
  return result.rows[0]
}

/**
 * Insert multiple rows sequentially
 */
export async function insertMany<T>(
  table: string,
  data: Partial<T>[]
): Promise<T[]> {
  const created: T[] = []
  for (const row of data) {
    created.push(await insertRow<T>(table, row))
  }
  return created
}

/**
 * Update a row by primary key
 */
export async function updateRow<T>(
  table: string,
  id: string,
  data: Partial<T>,
  idKey = "id"
): Promise<T> {
  const fields = { ...data } as Record<string, any>
  const columns = Object.keys(fields)
  const values = Object.values(fields)
  if (columns.length === 0) {
    return getById<T>(table, id, idKey)
  }
  const setClauses = columns.map((col, i) => `${col} = $${i + 1}`)
  const sql = `
    UPDATE ${table}
    SET ${setClauses.join(",")}
    WHERE ${idKey} = $${columns.length + 1}
    RETURNING *
  `
  const result = await pool.query(sql, [...values, id])
  if (result.rows.length === 0) {
    throw new Error(`${table} update failed`)
  }
  return result.rows[0]
}

/**
 * Delete a row by primary key
 */
export async function deleteRow(
  table: string,
  id: string,
  idKey = "id"
): Promise<void> {
  await pool.query(`DELETE FROM ${table} WHERE ${idKey} = $1`, [id])
}
