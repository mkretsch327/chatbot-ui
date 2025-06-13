// @ts-nocheck
// @ts-nocheck
"use client"
import { useContext } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { TabsContent } from "../ui/tabs"
import { ChatbotUIContext } from "@/context/context"
import { ContentType } from "@/types"
import { ModelOption } from "../models/model-option"

interface SidebarProps {
  contentType: ContentType
  showSidebar: boolean
}

/**
 * Sidebar content panels for each category
 */
export const Sidebar = ({ contentType, showSidebar }: SidebarProps) => {
  if (!showSidebar) return null
  const {
    chats,
    files,
    assistants,
    collections,
    prompts,
    presets,
    tools,
    models,
    availableHostedModels,
    availableLocalModels,
    availableOpenRouterModels,
    chatSettings,
    setChatSettings
  } = useContext(ChatbotUIContext)
  const { locale, workspaceid } = useParams() as { locale: string; workspaceid: string }

  return (
    <div className="h-full overflow-auto p-4">
      <TabsContent value="chats">
        <h4 className="font-bold mb-2">Chats</h4>
        {chats.map((c: any) => (
          <Link
            key={c.id}
            href={`/${locale}/${workspaceid}/chat/${c.id}`}
            className="block p-1 hover:bg-gray-200 rounded"
          >
            {c.name || "Untitled Chat"}
          </Link>
        ))}
      </TabsContent>
      <TabsContent value="files">
        <h4 className="font-bold mb-2">Files</h4>
        {files.map((f: any) => (
          <div key={f.id} className="p-1">{f.name}</div>
        ))}
      </TabsContent>
      <TabsContent value="assistants">
        <h4 className="font-bold mb-2">Assistants</h4>
        {assistants.map((a: any) => (
          <div key={a.id} className="p-1">{a.name}</div>
        ))}
      </TabsContent>
      <TabsContent value="collections">
        <h4 className="font-bold mb-2">Collections</h4>
        {collections.map((col: any) => (
          <div key={col.id} className="p-1">{col.name}</div>
        ))}
      </TabsContent>
      <TabsContent value="prompts">
        <h4 className="font-bold mb-2">Prompts</h4>
        {prompts.map((p: any) => (
          <div key={p.id} className="p-1">{p.name}</div>
        ))}
      </TabsContent>
      <TabsContent value="presets">
        <h4 className="font-bold mb-2">Presets</h4>
        {presets.map((pr: any) => (
          <div key={pr.id} className="p-1">{pr.name}</div>
        ))}
      </TabsContent>
      <TabsContent value="tools">
        <h4 className="font-bold mb-2">Tools</h4>
        {tools.map((t: any) => (
          <div key={t.id} className="p-1">{t.name}</div>
        ))}
      </TabsContent>
      <TabsContent value="models">
        <h4 className="font-bold mb-2">Models</h4>
        {/* List available models and allow picking */}
        {[...availableHostedModels, ...availableLocalModels, ...availableOpenRouterModels].map((model: any) => (
          <div
            key={model.modelId}
            className="p-1"
          >
            <ModelOption
              model={model}
              onSelect={() => setChatSettings({ ...chatSettings, model: model.modelId })}
            />
          </div>
        ))}
      </TabsContent>
    </div>
  )
}