"use client"
import { useContext } from 'react'
import { ChatbotUIContext } from '@/context/context'

/**
 * Hook for handling input changes in the chat input.
 */
export function usePromptAndCommand() {
  const { setUserInput } = useContext(ChatbotUIContext)
  return {
    handleInputChange: (value: string) => setUserInput(value),
    handleSelectPrompt: (_p: any) => {},
    handleSelectUserFile: (_file: any) => {},
    handleSelectUserCollection: (_c: any) => {},
    handleSelectTool: (_t: any) => {},
    handleSelectAssistant: (_a: any) => {},
  }
}