import { Tables } from "@/db/types"
import {
  uploadFile,
  deleteFileFromStorage,
  getFileFromStorage
} from "@/db/storage/files"

export async function uploadAssistantImage(
  assistant: Tables<"assistants">,
  image: File
): Promise<string> {
  // Limit image size
  const IMAGE_SIZE_LIMIT = 6000000
  if (image.size > IMAGE_SIZE_LIMIT) {
    throw new Error(`Image must be less than ${IMAGE_SIZE_LIMIT / 1000000}MB`)
  }
  const filePath = `${assistant.user_id}/${assistant.id}/${Date.now()}`
  return uploadFile(image, {
    name: assistant.id,
    user_id: assistant.user_id,
    file_id: filePath
  })
}

export function getAssistantImageFromStorage(filePath: string): string {
  return getFileFromStorage(filePath)
}
