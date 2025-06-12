import { Tables } from "@/db/types"
import {
  uploadFile,
  deleteFileFromStorage,
  getFileFromStorage
} from "@/db/storage/files"

export async function uploadProfileImage(
  profile: Tables<"profiles">,
  image: File
): Promise<{ path: string; url: string }> {
  const IMAGE_SIZE_LIMIT = 2000000
  if (image.size > IMAGE_SIZE_LIMIT) {
    throw new Error(`Image must be less than ${IMAGE_SIZE_LIMIT / 1000000}MB`)
  }
  const filePath = `${profile.user_id}/${Date.now()}`
  await uploadFile(image, {
    name: profile.user_id,
    user_id: profile.user_id,
    file_id: filePath
  })
  return { path: filePath, url: getFileFromStorage(filePath) }
}
