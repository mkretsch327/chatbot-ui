import { Tables } from "@/db/types"
import {
  uploadFile,
  deleteFileFromStorage,
  getFileFromStorage
} from "@/db/storage/files"

export async function uploadWorkspaceImage(
  workspace: Tables<"workspaces">,
  image: File
): Promise<string> {
  const IMAGE_SIZE_LIMIT = 6000000
  if (image.size > IMAGE_SIZE_LIMIT) {
    throw new Error(`Image must be less than ${IMAGE_SIZE_LIMIT / 1000000}MB`)
  }
  const filePath = `${workspace.user_id}/${workspace.id}/${Date.now()}`
  return uploadFile(image, {
    name: workspace.id,
    user_id: workspace.user_id,
    file_id: filePath
  })
}

export function getWorkspaceImageFromStorage(filePath: string): string {
  return getFileFromStorage(filePath)
}
