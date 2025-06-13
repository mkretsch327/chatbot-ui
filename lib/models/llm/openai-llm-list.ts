import { LLM } from "@/types"

const OPENAI_PLATORM_LINK = "https://platform.openai.com/docs/overview"

// OpenAI Models (UPDATED 1/25/24) -----------------------------
const GPT4o: LLM = {
  modelId: "gpt-4o",
  modelName: "GPT-4o",
  provider: "openai",
  hostedId: "gpt-4o",
  platformLink: OPENAI_PLATORM_LINK,
  imageInput: true,

}

const GPT41: LLM = {
  modelId: "gpt-4.1",
  modelName: "GPT-4.1",
  provider: "openai",
  hostedId: "gpt-4.1-2025-04-14",
  platformLink: OPENAI_PLATORM_LINK,
  imageInput: true,

}
const o3: LLM = {
  modelId: "o3",
  modelName: "o3",
  provider: "openai",
  hostedId: "o3-2025-04-16",
  platformLink: OPENAI_PLATORM_LINK,
  imageInput: true,
}

export const OPENAI_LLM_LIST: LLM[] = [
  GPT4o,
  GPT41,
  o3,
]
