import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file") as Blob | null
  const filePath = formData.get("path") as string | null
  if (!file || !filePath) {
    return new NextResponse("Invalid upload data", { status: 400 })
  }
  try {
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "files",
      path.dirname(filePath)
    )
    await fs.mkdir(uploadDir, { recursive: true })
    const fullPath = path.join(process.cwd(), "public", "files", filePath)
    const buffer = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(fullPath, buffer)
    return new NextResponse(JSON.stringify({ path: filePath }), { status: 200 })
  } catch (err: any) {
    console.error("File upload error:", err)
    return new NextResponse("Upload failed", { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const filePath = searchParams.get("path")
  if (!filePath) {
    return new NextResponse("Missing path", { status: 400 })
  }
  try {
    const fullPath = path.join(process.cwd(), "public", "files", filePath)
    await fs.unlink(fullPath)
    return new NextResponse("Deleted", { status: 200 })
  } catch (err: any) {
    console.error("File delete error:", err)
    return new NextResponse("Delete failed", { status: 500 })
  }
}
