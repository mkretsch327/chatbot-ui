// Local file storage via API; Supabase removed

export const uploadFile = async (
  file: File,
  payload: {
    name: string
    user_id: string
    file_id: string
  }
) => {
  const SIZE_LIMIT = parseInt(
    process.env.NEXT_PUBLIC_USER_FILE_SIZE_LIMIT || "10000000"
  )

  if (file.size > SIZE_LIMIT) {
    throw new Error(
      `File must be less than ${Math.floor(SIZE_LIMIT / 1000000)}MB`
    )
  }

  const filePath = `${payload.user_id}/${Buffer.from(payload.file_id).toString("base64")}`
  const form = new FormData()
  form.append("file", file)
  form.append("path", filePath)
  const res = await fetch("/api/files", { method: "POST", body: form })
  if (!res.ok) {
    throw new Error("Error uploading file")
  }
  return filePath
}

export const deleteFileFromStorage = async (filePath: string) => {
  const res = await fetch(`/api/files?path=${encodeURIComponent(filePath)}`, {
    method: "DELETE"
  })
  if (!res.ok) {
    throw new Error("Failed to remove file")
  }
}

export const getFileFromStorage = (filePath: string) => {
  // Direct URL to public/static file
  return `/files/${filePath}`
}
