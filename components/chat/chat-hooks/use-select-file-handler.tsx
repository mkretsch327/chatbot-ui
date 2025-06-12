import { ChatbotUIContext } from "@/context/context"
// createDocXFile & createFile removed: handled by server API /api/chat/files
import { LLM_LIST } from "@/lib/models/llm/llm-list"
// mammoth extraction moved to server side
import { useContext, useEffect, useState } from "react"
import { toast } from "sonner"

export const ACCEPTED_FILE_TYPES = [
  "text/csv",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
  "text/markdown",
  "application/pdf",
  "text/plain"
].join(",")

export const useSelectFileHandler = () => {
  const {
    selectedWorkspace,
    profile,
    chatSettings,
    setNewMessageImages,
    setNewMessageFiles,
    setShowFilesDisplay,
    setFiles,
    setUseRetrieval
  } = useContext(ChatbotUIContext)

  const [filesToAccept, setFilesToAccept] = useState(ACCEPTED_FILE_TYPES)

  useEffect(() => {
    handleFilesToAccept()
  }, [chatSettings?.model])

  const handleFilesToAccept = () => {
    const model = chatSettings?.model
    const FULL_MODEL = LLM_LIST.find(llm => llm.modelId === model)

    if (!FULL_MODEL) return

    setFilesToAccept(
      FULL_MODEL.imageInput
        ? `${ACCEPTED_FILE_TYPES},image/*`
        : ACCEPTED_FILE_TYPES
    )
  }

  const handleSelectDeviceFile = async (file: File) => {
    if (!profile || !selectedWorkspace || !chatSettings) return

    setShowFilesDisplay(true)
    setUseRetrieval(true)

    if (file) {
      let simplifiedFileType = file.type.split("/")[1]

      let reader = new FileReader()

      if (file.type.includes("image")) {
        reader.readAsDataURL(file)
      } else if (ACCEPTED_FILE_TYPES.split(",").includes(file.type)) {
        if (simplifiedFileType.includes("vnd.adobe.pdf")) {
          simplifiedFileType = "pdf"
        } else if (
          simplifiedFileType.includes(
            "vnd.openxmlformats-officedocument.wordprocessingml.document" ||
              "docx"
          )
        ) {
          simplifiedFileType = "docx"
        }

        // Prepare placeholder for the new message file
        setNewMessageFiles(prev => [
          ...prev,
          { id: 'loading', name: file.name, type: simplifiedFileType, file }
        ])
        // Upload file via server API
        try {
          const form = new FormData()
          form.append('file', file)
          form.append(
            'metadata',
            JSON.stringify({
              user_id: profile.user_id,
              description: '',
              name: file.name,
              size: file.size,
              tokens: 0,
              type: simplifiedFileType,
              workspace_id: selectedWorkspace.id,
              embeddingsProvider: chatSettings.embeddingsProvider
            })
          )
          const res = await fetch('/api/chat/files', { method: 'POST', body: form })
          if (!res.ok) throw new Error('Upload failed: ' + res.statusText)
          const createdFile = await res.json()
          setFiles(prev => [...prev, createdFile])
          setNewMessageFiles(prev =>
            prev.map(item =>
              item.id === 'loading'
                ? { id: createdFile.id, name: createdFile.name, type: createdFile.type, file }
                : item
            )
          )
        } catch (error: any) {
          toast.error('Failed to upload. ' + (error.message || ''), { duration: 10000 })
          setNewMessageFiles(prev => prev.filter(item => item.id !== 'loading'))
        }
        return
      } else {
        throw new Error("Unsupported file type")
      }

      // Only handle image previews on reader load
      reader.onloadend = () => {
        if (file.type.includes("image")) {
          const imageUrl = URL.createObjectURL(file)
          setNewMessageImages(prev => [
            ...prev,
            {
              messageId: "temp",
              path: "",
              base64: reader.result as string,
              url: imageUrl,
              file
            }
          ])
        }
      }
    }
  }

  return {
    handleSelectDeviceFile,
    filesToAccept
  }
}
