import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"

export async function getProfile(): Promise<Tables<"profiles">> {
  const result = await pool.query("SELECT * FROM profiles LIMIT 1")
  if (result.rows.length === 0) {
    throw new Error("Profile not found")
  }
  return result.rows[0]
}

export async function createProfile(
  profile: TablesInsert<"profiles">
): Promise<Tables<"profiles">> {
  const columns = Object.keys(profile)
  const values = Object.values(profile)
  const placeholders = columns.map((_, i) => `$${i + 1}`)
  const sql = `
    INSERT INTO profiles (${columns.join(",")})
    VALUES (${placeholders.join(",")})
    RETURNING *
  `
  const result = await pool.query(sql, values)
  return result.rows[0]
}

export async function updateProfile(
  profileId: string,
  profile: TablesUpdate<"profiles">
): Promise<Tables<"profiles">> {
  const fields = { ...profile } as Record<string, any>
  const columns = Object.keys(fields)
  const values = Object.values(fields)
  if (columns.length === 0) {
    return getProfile()
  }
  const setClauses = columns.map((col, i) => `${col} = $${i + 1}`)
  const sql = `
    UPDATE profiles
    SET ${setClauses.join(",")}
    WHERE id = $${columns.length + 1}
    RETURNING *
  `
  const result = await pool.query(sql, [...values, profileId])
  if (result.rows.length === 0) {
    throw new Error("Profile update failed")
  }
  return result.rows[0]
}
