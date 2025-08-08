"use client"
import { useRouter, useParams } from "next/navigation"
import { useRef, useContext } from "react"
import { v4 as uuidv4 } from 'uuid'
import { toast } from 'sonner'
import { ChatbotUIContext } from '@/context/context'

/**
 * Stub hook for chat handling; actual logic to be implemented server-side.
 */
export const useChatHandler = () => {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const workspaceid = params.workspaceid as string
  const {
    profile,
    userInput,
    setUserInput,
    chatMessages,
    setChatMessages,
    chatSettings,
    selectedChat,
    selectedWorkspace,
    setChats,
    setSelectedChat,
    setIsGenerating
  } = useContext(ChatbotUIContext)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleNewChat = () => {
    router.push('/')
  }

  const handleFocusChatInput = () => {
    chatInputRef.current?.focus()
  }

  const handleStopMessage = () => {
    abortControllerRef.current?.abort()
    setIsGenerating(false)
  }

  const handleSendMessage = async (
    messageContent: string,
    _history: any[],
    _regen: boolean
  ) => {
    if (!chatSettings || !messageContent.trim()) return
    // Ensure a chat record exists
    let chatId = selectedChat?.id
    if (!selectedChat) {
      if (!selectedWorkspace) {
        toast.error('No workspace selected')
        return
      }
      let newChat: any
      try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: selectedWorkspace.id,
            name: null,
            model: chatSettings.model,
            prompt: chatSettings.prompt,
            temperature: chatSettings.temperature,
            context_length: chatSettings.contextLength,
            include_profile_context: chatSettings.includeProfileContext,
            include_workspace_instructions: chatSettings.includeWorkspaceInstructions,
            embeddings_provider: chatSettings.embeddingsProvider
          })
        })
        if (!res.ok) throw new Error('Failed to create chat')
        newChat = await res.json()
        // update client-side chat list
        setChats(prev => [...prev, newChat])
        setSelectedChat(newChat)
        chatId = newChat.id
        // navigate to new chat URL
        router.push(`/${locale}/${workspaceid}/chat/${newChat.id}`)
      } catch (e) {
        console.error(e)
        toast.error('Unable to start chat')
        return
      }
    }
    setUserInput('')
    // Add user message to UI
    const userSeq = chatMessages.length
    const userMsg = {
      message: {
        id: uuidv4(),
        chat_id: chatId!,
        user_id: profile?.user_id || '',
        content: messageContent,
        role: 'user',
        model: chatSettings.model,
        sequence_number: userSeq,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      fileItems: []
    }
    setChatMessages(prev => [...prev, userMsg])
    // Persist user message
    try {
      await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          content: messageContent,
          role: 'user',
          sequence_number: userSeq,
          model: chatSettings.model
        })
      })
    } catch (e) {
      console.error('Failed to save user message', e)
    }

    // Create assistant placeholder
    const assistantSeq = userSeq + 1
    const assistantMsgId = uuidv4()
    const assistantMsg = {
      message: {
        id: assistantMsgId,
        chat_id: chatId!,
        user_id: profile?.user_id || '',
        content: '',
        role: 'assistant',
        model: chatSettings.model,
        sequence_number: assistantSeq,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      fileItems: []
    }
    setChatMessages(prev => [...prev, assistantMsg])
    setIsGenerating(true)
    // Call OpenAI stream
    abortControllerRef.current = new AbortController()
    try {
      const res = await fetch('/api/chat/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatSettings,
          messages: [
            ...chatMessages.map(m => ({ role: m.message.role, content: m.message.content })),
            { role: 'user', content: messageContent }
          ]
        }),
        signal: abortControllerRef.current.signal
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || 'Error from API')
        setIsGenerating(false)
        return
      }
      const reader = res.body?.getReader()
      if (!reader) return
      const decoder = new TextDecoder()
      let done = false
      let assistantContent = ''
      let buffer = ''
      // Read SSE chunks from OpenAI Responses API (SSE)
      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        if (value) {
          // Decode chunk and accumulate
          buffer += decoder.decode(value, { stream: true })
          // Split complete SSE events
          const parts = buffer.split('\n\n')
          // Keep last partial event in buffer
          buffer = parts.pop() || ''
          for (const part of parts) {
            // Each 'part' may include multiple lines like:
            // event: response.output_text.delta\n
            // data: { ... }\n
            // Find the 'data:' line regardless of order
            const lines = part.split('\n')
            let dataLine = ''
            for (const l of lines) {
              const t = l.trim()
              if (t.startsWith('data:')) {
                dataLine = t.slice(5).trim()
                break
              }
            }
            if (!dataLine) continue
            if (dataLine === '[DONE]') {
              done = true
              break
            }
            // Parse JSON payload
            let parsed: any
            try {
              parsed = JSON.parse(dataLine)
            } catch {
              continue
            }
            // Handle OpenAI Responses streaming event types
            let appendText = ''
            if (typeof parsed?.delta === 'string' && typeof parsed?.type === 'string' && parsed.type.endsWith('.delta')) {
              appendText = parsed.delta
            } else if (parsed?.type === 'response.completed') {
              done = true
            } else if (typeof parsed?.output_text === 'string') {
              appendText = parsed.output_text
            } else if (typeof parsed?.token === 'string') {
              appendText = parsed.token
            }
            if (appendText) {
              assistantContent += appendText
              setChatMessages(prev => prev.map(msg =>
                msg.message.id === assistantMsgId
                  ? { ...msg, message: { ...msg.message, content: assistantContent } }
                  : msg
              ))
            }
          }
        }
      }
      // Persist assistant message
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            content: assistantContent,
            role: 'assistant',
            sequence_number: assistantSeq,
            model: chatSettings.model
          })
        })
      } catch (e) {
        console.error('Failed to save assistant message', e)
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        toast.error('Generation aborted')
      } else {
        console.error(e)
        toast.error('Error during chat')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    chatInputRef,
    handleNewChat,
    handleSendMessage,
    handleFocusChatInput,
    handleStopMessage,
    // Stub for edit handling
    handleSendEdit: (_edited: string, _seq: number) => {}
  }
}

// export const useChatHandler = () => {
//   const router = useRouter()

//   const {
//     userInput,
//     chatFiles,
//     setUserInput,
//     setNewMessageImages,
//     profile,
//     setIsGenerating,
//     setChatMessages,
//     setFirstTokenReceived,
//     selectedChat,
//     selectedWorkspace,
//     setSelectedChat,
//     setChats,
//     setSelectedTools,
//     availableLocalModels,
//     availableOpenRouterModels,
//     abortController,
//     setAbortController,
//     chatSettings,
//     newMessageImages,
//     selectedAssistant,
//     chatMessages,
//     chatImages,
//     setChatImages,
//     setChatFiles,
//     setNewMessageFiles,
//     setShowFilesDisplay,
//     newMessageFiles,
//     chatFileItems,
//     setChatFileItems,
//     setToolInUse,
//     useRetrieval,
//     sourceCount,
//     setIsPromptPickerOpen,
//     setIsFilePickerOpen,
//     selectedTools,
//     selectedPreset,
//     setChatSettings,
//     models,
//     isPromptPickerOpen,
//     isFilePickerOpen,
//     isToolPickerOpen
//   } = useContext(ChatbotUIContext)

//   const chatInputRef = useRef<HTMLTextAreaElement>(null)

//   useEffect(() => {
//     if (!isPromptPickerOpen || !isFilePickerOpen || !isToolPickerOpen) {
//       chatInputRef.current?.focus()
//     }
//   }, [isPromptPickerOpen, isFilePickerOpen, isToolPickerOpen])

//   const handleNewChat = async () => {
//     if (!selectedWorkspace) return

//     setUserInput("")
//     setChatMessages([])
//     setSelectedChat(null)
//     setChatFileItems([])

//     setIsGenerating(false)
//     setFirstTokenReceived(false)

//     setChatFiles([])
//     setChatImages([])
//     setNewMessageFiles([])
//     setNewMessageImages([])
//     setShowFilesDisplay(false)
//     setIsPromptPickerOpen(false)
//     setIsFilePickerOpen(false)

//     setSelectedTools([])
//     setToolInUse("none")

//     if (selectedAssistant) {
//       setChatSettings({
//         model: selectedAssistant.model as LLMID,
//         prompt: selectedAssistant.prompt,
//         temperature: selectedAssistant.temperature,
//         contextLength: selectedAssistant.context_length,
//         includeProfileContext: selectedAssistant.include_profile_context,
//         includeWorkspaceInstructions:
//           selectedAssistant.include_workspace_instructions,
//         embeddingsProvider: selectedAssistant.embeddings_provider as
//           | "openai"
//           | "local"
//       })

//       let allFiles = []

//       const assistantFiles = (
//         await getAssistantFilesByAssistantId(selectedAssistant.id)
//       ).files
//       allFiles = [...assistantFiles]
//       const assistantCollections = (
//         await getAssistantCollectionsByAssistantId(selectedAssistant.id)
//       ).collections
//       for (const collection of assistantCollections) {
//         const collectionFiles = (
//           await getCollectionFilesByCollectionId(collection.id)
//         ).files
//         allFiles = [...allFiles, ...collectionFiles]
//       }
//       const assistantTools = (
//         await getAssistantToolsByAssistantId(selectedAssistant.id)
//       ).tools

//       setSelectedTools(assistantTools)
//       setChatFiles(
//         allFiles.map(file => ({
//           id: file.id,
//           name: file.name,
//           type: file.type,
//           file: null
//         }))
//       )

//       if (allFiles.length > 0) setShowFilesDisplay(true)
//     } else if (selectedPreset) {
//       setChatSettings({
//         model: selectedPreset.model as LLMID,
//         prompt: selectedPreset.prompt,
//         temperature: selectedPreset.temperature,
//         contextLength: selectedPreset.context_length,
//         includeProfileContext: selectedPreset.include_profile_context,
//         includeWorkspaceInstructions:
//           selectedPreset.include_workspace_instructions,
//         embeddingsProvider: selectedPreset.embeddings_provider as
//           | "openai"
//           | "local"
//       })
//     } else if (selectedWorkspace) {
//       // setChatSettings({
//       //   model: (selectedWorkspace.default_model ||
//       //     "gpt-4-1106-preview") as LLMID,
//       //   prompt:
//       //     selectedWorkspace.default_prompt ||
//       //     "You are a friendly, helpful AI assistant.",
//       //   temperature: selectedWorkspace.default_temperature || 0.5,
//       //   contextLength: selectedWorkspace.default_context_length || 4096,
//       //   includeProfileContext:
//       //     selectedWorkspace.include_profile_context || true,
//       //   includeWorkspaceInstructions:
//       //     selectedWorkspace.include_workspace_instructions || true,
//       //   embeddingsProvider:
//       //     (selectedWorkspace.embeddings_provider as "openai" | "local") ||
//       //     "openai"
//       // })
//     }

//     return router.push(`/${selectedWorkspace.id}/chat`)
//   }

//   const handleFocusChatInput = () => {
//     chatInputRef.current?.focus()
//   }

//   const handleStopMessage = () => {
//     if (abortController) {
//       abortController.abort()
//     }
//   }

//   const handleSendMessage = async (
//     messageContent: string,
//     chatMessages: ChatMessage[],
//     isRegeneration: boolean
//   ) => {
//     const startingInput = messageContent

//     try {
//       setUserInput("")
//       setIsGenerating(true)
//       setIsPromptPickerOpen(false)
//       setIsFilePickerOpen(false)
//       setNewMessageImages([])

//       const newAbortController = new AbortController()
//       setAbortController(newAbortController)

//       const modelData = [
//         ...models.map(model => ({
//           modelId: model.model_id as LLMID,
//           modelName: model.name,
//           provider: "custom" as ModelProvider,
//           hostedId: model.id,
//           platformLink: "",
//           imageInput: false
//         })),
//         ...LLM_LIST,
//         ...availableLocalModels,
//         ...availableOpenRouterModels
//       ].find(llm => llm.modelId === chatSettings?.model)

//       validateChatSettings(
//         chatSettings,
//         modelData,
//         profile,
//         selectedWorkspace,
//         messageContent
//       )

//       let currentChat = selectedChat ? { ...selectedChat } : null

//       const b64Images = newMessageImages.map(image => image.base64)

//       let retrievedFileItems: Tables<"file_items">[] = []

//       if (
//         (newMessageFiles.length > 0 || chatFiles.length > 0) &&
//         useRetrieval
//       ) {
//         setToolInUse("retrieval")

//         retrievedFileItems = await handleRetrieval(
//           userInput,
//           newMessageFiles,
//           chatFiles,
//           chatSettings!.embeddingsProvider,
//           sourceCount
//         )
//       }

//       const { tempUserChatMessage, tempAssistantChatMessage } =
//         createTempMessages(
//           messageContent,
//           chatMessages,
//           chatSettings!,
//           b64Images,
//           isRegeneration,
//           setChatMessages,
//           selectedAssistant
//         )

//       let payload: ChatPayload = {
//         chatSettings: chatSettings!,
//         workspaceInstructions: selectedWorkspace!.instructions || "",
//         chatMessages: isRegeneration
//           ? [...chatMessages]
//           : [...chatMessages, tempUserChatMessage],
//         assistant: selectedChat?.assistant_id ? selectedAssistant : null,
//         messageFileItems: retrievedFileItems,
//         chatFileItems: chatFileItems
//       }

//       let generatedText = ""

//       if (selectedTools.length > 0) {
//         setToolInUse("Tools")

//         const formattedMessages = await buildFinalMessages(
//           payload,
//           profile!,
//           chatImages
//         )

//         const response = await fetch("/api/chat/tools", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json"
//           },
//           body: JSON.stringify({
//             chatSettings: payload.chatSettings,
//             messages: formattedMessages,
//             selectedTools
//           })
//         })

//         setToolInUse("none")

//         generatedText = await processResponse(
//           response,
//           isRegeneration
//             ? payload.chatMessages[payload.chatMessages.length - 1]
//             : tempAssistantChatMessage,
//           true,
//           newAbortController,
//           setFirstTokenReceived,
//           setChatMessages,
//           setToolInUse
//         )
//       } else {
//         if (modelData!.provider === "ollama") {
//           generatedText = await handleLocalChat(
//             payload,
//             profile!,
//             chatSettings!,
//             tempAssistantChatMessage,
//             isRegeneration,
//             newAbortController,
//             setIsGenerating,
//             setFirstTokenReceived,
//             setChatMessages,
//             setToolInUse
//           )
//         } else {
//           generatedText = await handleHostedChat(
//             payload,
//             profile!,
//             modelData!,
//             tempAssistantChatMessage,
//             isRegeneration,
//             newAbortController,
//             newMessageImages,
//             chatImages,
//             setIsGenerating,
//             setFirstTokenReceived,
//             setChatMessages,
//             setToolInUse
//           )
//         }
//       }

//       if (!currentChat) {
//         currentChat = await handleCreateChat(
//           chatSettings!,
//           profile!,
//           selectedWorkspace!,
//           messageContent,
//           selectedAssistant!,
//           newMessageFiles,
//           setSelectedChat,
//           setChats,
//           setChatFiles
//         )
//       } else {
//         const updatedChat = await updateChat(currentChat.id, {
//           updated_at: new Date().toISOString()
//         })

//         setChats(prevChats => {
//           const updatedChats = prevChats.map(prevChat =>
//             prevChat.id === updatedChat.id ? updatedChat : prevChat
//           )

//           return updatedChats
//         })
//       }

//       await handleCreateMessages(
//         chatMessages,
//         currentChat,
//         profile!,
//         modelData!,
//         messageContent,
//         generatedText,
//         newMessageImages,
//         isRegeneration,
//         retrievedFileItems,
//         setChatMessages,
//         setChatFileItems,
//         setChatImages,
//         selectedAssistant
//       )

//       setIsGenerating(false)
//       setFirstTokenReceived(false)
//     } catch (error) {
//       setIsGenerating(false)
//       setFirstTokenReceived(false)
//       setUserInput(startingInput)
//     }
//   }

//   const handleSendEdit = async (
//     editedContent: string,
//     sequenceNumber: number
//   ) => {
//     if (!selectedChat) return

//     await deleteMessagesIncludingAndAfter(
//       selectedChat.user_id,
//       selectedChat.id,
//       sequenceNumber
//     )

//     const filteredMessages = chatMessages.filter(
//       chatMessage => chatMessage.message.sequence_number < sequenceNumber
//     )

//     setChatMessages(filteredMessages)

//     handleSendMessage(editedContent, filteredMessages, false)
//   }

//   return {
//     chatInputRef,
//     prompt,
//     handleNewChat,
//     handleSendMessage,
//     handleFocusChatInput,
//     handleStopMessage,
//     handleSendEdit
//   }
// }
