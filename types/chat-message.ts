import { Tables } from "@/db/types"

export interface ChatMessage {
  message: Tables<"messages">
  fileItems: string[]
}
