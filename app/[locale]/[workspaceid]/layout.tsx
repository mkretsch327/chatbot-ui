"use client"

import { Dashboard } from "@/components/ui/dashboard"
import { ChatbotUIContext } from "@/context/context"
// DB data is loaded via /api/workspace-data; helper to load only images
import { getAssistantImageFromStorage } from "@/db/storage/assistant-images"
import { convertBlobToBase64 } from "@/lib/blob-to-b64"
import { LLMID } from "@/types"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ReactNode, useContext, useEffect, useState } from "react"
import Loading from "../loading"

interface WorkspaceLayoutProps {
  children: ReactNode
}

export default function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const router = useRouter()

  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceid as string

  const {
    setChatSettings,
    setAssistants,
    setAssistantImages,
    setChats,
    setCollections,
    setFolders,
    setFiles,
    setPresets,
    setPrompts,
    setTools,
    setModels,
    selectedWorkspace,
    setSelectedWorkspace,
    setSelectedChat,
    setChatMessages,
    setUserInput,
    setIsGenerating,
    setFirstTokenReceived,
    setChatFiles,
    setChatImages,
    setNewMessageFiles,
    setNewMessageImages,
    setShowFilesDisplay
  } = useContext(ChatbotUIContext)

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch workspace data via API
    fetchWorkspaceData(workspaceId)
  }, [])

  useEffect(() => {
    // Re-fetch when workspace changes
    fetchWorkspaceData(workspaceId)

    setUserInput("")
    setChatMessages([])
    setSelectedChat(null)

    setIsGenerating(false)
    setFirstTokenReceived(false)

    setChatFiles([])
    setChatImages([])
    setNewMessageFiles([])
    setNewMessageImages([])
    setShowFilesDisplay(false)
  }, [workspaceId])

  const fetchWorkspaceData = async (workspaceId: string) => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/workspace-data?workspaceId=${encodeURIComponent(
          workspaceId
        )}`
      )
      if (!res.ok) {
        console.error('Failed to load workspace data:', res.statusText)
        return
      }
      const data = await res.json()
      const {
        workspace,
        assistants = [],
        chats = [],
        collections = [],
        folders = [],
        files = [],
        presets = [],
        prompts = [],
        tools = [],
        models = []
      } = data
      setSelectedWorkspace(workspace)
      setAssistants(assistants)
      setAssistantImages([])
      for (const assistant of assistants) {
        let url = ''
        if (assistant.image_path) {
          url = (await getAssistantImageFromStorage(
            assistant.image_path
          )) || ''
        }
        if (url) {
          const resp = await fetch(url)
          const blob = await resp.blob()
          const base64 = await convertBlobToBase64(blob)
          setAssistantImages(prev => [
            ...prev,
            { assistantId: assistant.id, path: assistant.image_path, base64, url }
          ])
        } else {
          setAssistantImages(prev => [
            ...prev,
            { assistantId: assistant.id, path: assistant.image_path, base64: '', url }
          ])
        }
      }
      setChats(chats)
      setCollections(collections)
      setFolders(folders)
      setFiles(files)
      setPresets(presets)
      setPrompts(prompts)
      setTools(tools)
      setModels(models)
      setChatSettings({
        model: (searchParams.get('model') || workspace.default_model ||
          'gpt-4.1-2025-04-14') as LLMID,
        prompt: workspace.default_prompt ||
          'You are a friendly, helpful AI assistant.',
        temperature: workspace.default_temperature || 0.5,
        contextLength: workspace.default_context_length || 4096,
        includeProfileContext: workspace.include_profile_context || true,
        includeWorkspaceInstructions: workspace.include_workspace_instructions ?? true,
        embeddingsProvider: (workspace.embeddings_provider as 'openai' | 'local') || 'openai'
      })
    } catch (err) {
      console.error('Error fetching workspace data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Loading />
  }

  // Render with sidebar dashboard wrapper
  return <Dashboard>{children}</Dashboard>
}
