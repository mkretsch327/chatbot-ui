// @ts-nocheck
import { pool } from "@/db/client"
import { TablesInsert, TablesUpdate, Tables } from "@/db/types"
import { insertRow, updateRow, deleteRow } from "./index"
import mammoth from "mammoth"
import { toast } from "sonner"
import { uploadFile } from "./storage/files"

export async function getFileById(fileId: string) {
  const result = await pool.query(`SELECT * FROM files WHERE id = $1 LIMIT 1`, [
    fileId
  ])
  if (result.rows.length === 0) throw new Error("File not found")
  return result.rows[0]
}

export async function getFilesByWorkspaceId(workspaceId: string) {
  const result = await pool.query(
    `SELECT f.* FROM files f
      JOIN file_workspaces fw ON fw.file_id = f.id
      WHERE fw.workspace_id = $1`,
    [workspaceId]
  )
  return result.rows
}

export async function getWorkspacesByFileId(fileId: string) {
  const result = await pool.query(
    `SELECT w.* FROM workspaces w
      JOIN file_workspaces fw ON fw.workspace_id = w.id
      WHERE fw.file_id = $1`,
    [fileId]
  )
  return result.rows
}

export const createFileBasedOnExtension = async (
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  const fileExtension = file.name.split(".").pop()

  if (fileExtension === "docx") {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({
      arrayBuffer
    })

    return createDocXFile(
      result.value,
      file,
      fileRecord,
      workspace_id,
      embeddingsProvider
    )
  } else {
    return createFile(file, fileRecord, workspace_id, embeddingsProvider)
  }
}

// For non-docx files
export const createFile = async (
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  let validFilename = fileRecord.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase()
  const extension = file.name.split(".").pop()
  const extensionIndex = validFilename.lastIndexOf(".")
  const baseName = validFilename.substring(
    0,
    extensionIndex < 0 ? undefined : extensionIndex
  )
  const maxBaseNameLength = 100 - (extension?.length || 0) - 1
  if (baseName.length > maxBaseNameLength) {
    fileRecord.name = baseName.substring(0, maxBaseNameLength) + "." + extension
  } else {
    fileRecord.name = baseName + "." + extension
  }
  // Insert file record into DB
  const createdFile = await insertRow<Tables<"files">>("files", fileRecord)

  // Associate file with workspace
  await createFileWorkspace(createdFile.user_id, createdFile.id, workspace_id)

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name
  })

  // Update file path on the record
  await updateRow<Tables<"files">>("files", createdFile.id, {
    file_path: filePath
  })

  const formData = new FormData()
  formData.append("file_id", createdFile.id)
  formData.append("embeddingsProvider", embeddingsProvider)

  const response = await fetch("/api/retrieval/process", {
    method: "POST",
    body: formData
  })

  if (!response.ok) {
    const jsonText = await response.text()
    const json = JSON.parse(jsonText)
    console.error(
      `Error processing file:${createdFile.id}, status:${response.status}, response:${json.message}`
    )
    toast.error("Failed to process file. Reason:" + json.message, {
      duration: 10000
    })
    await deleteFile(createdFile.id)
  }

  const fetchedFile = await getFileById(createdFile.id)

  return fetchedFile
}

// // Handle docx files
export const createDocXFile = async (
  text: string,
  file: File,
  fileRecord: TablesInsert<"files">,
  workspace_id: string,
  embeddingsProvider: "openai" | "local"
) => {
  // Insert file record for .docx
  const createdFile = await insertRow<Tables<"files">>("files", fileRecord)

  // Associate file with workspace
  await createFileWorkspace(createdFile.user_id, createdFile.id, workspace_id)

  const filePath = await uploadFile(file, {
    name: createdFile.name,
    user_id: createdFile.user_id,
    file_id: createdFile.name
  })

  // Update file path
  await updateRow<Tables<"files">>("files", createdFile.id, {
    file_path: filePath
  })

  const response = await fetch("/api/retrieval/process/docx", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text: text,
      fileId: createdFile.id,
      embeddingsProvider,
      fileExtension: "docx"
    })
  })

  if (!response.ok) {
    const jsonText = await response.text()
    const json = JSON.parse(jsonText)
    console.error(
      `Error processing file:${createdFile.id}, status:${response.status}, response:${json.message}`
    )
    toast.error("Failed to process file. Reason:" + json.message, {
      duration: 10000
    })
    await deleteFile(createdFile.id)
  }

  const fetchedFile = await getFileById(createdFile.id)

  return fetchedFile
}

export const createFiles = async (
  files: TablesInsert<"files">[],
  workspace_id: string
) => {
  const { data: createdFiles, error } = await supabase
    .from("files")
    .insert(files)
    .select("*")

  if (error) {
    throw new Error(error.message)
  }

  await createFileWorkspaces(
    createdFiles.map(file => ({
      user_id: file.user_id,
      file_id: file.id,
      workspace_id
    }))
  )

  return createdFiles
}

export async function createFileWorkspace(
  user_id: string,
  file_id: string,
  workspace_id: string
) {
  await pool.query(
    `INSERT INTO file_workspaces (user_id, file_id, workspace_id)
     VALUES ($1, $2, $3)`,
    [user_id, file_id, workspace_id]
  )
}

export async function createFileWorkspaces(
  items: { user_id: string; file_id: string; workspace_id: string }[]
) {
  for (const it of items) {
    await createFileWorkspace(it.user_id, it.file_id, it.workspace_id)
  }
}

export async function updateFile(fileId: string, file: TablesUpdate<"files">) {
  return updateRow<Tables<"files">>("files", fileId, file)
}

export async function deleteFile(fileId: string) {
  await deleteRow("files", fileId)
}

export async function deleteFileWorkspace(fileId: string, workspaceId: string) {
  await pool.query(
    `DELETE FROM file_workspaces WHERE file_id = $1 AND workspace_id = $2`,
    [fileId, workspaceId]
  )
}
