// Local image storage via API

import {
  uploadFile,
  getFileFromStorage,
  deleteFileFromStorage
} from "@/db/storage/files"

export async function uploadMessageImage(
  _unused: string,
  image: File
): Promise<string> {
  // path is provided in image.name or message; using image.name
  const IMAGE_SIZE_LIMIT = 6000000
  if (image.size > IMAGE_SIZE_LIMIT) {
    throw new Error(`Image must be less than ${IMAGE_SIZE_LIMIT / 1000000}MB`)
  }
  const filePath = image.name
  return uploadFile(image, {
    name: filePath,
    user_id: "",
    file_id: filePath
  })
}

export function getMessageImageFromStorage(filePath: string): string {
  return getFileFromStorage(filePath)
}
