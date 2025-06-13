// @ts-nocheck
import { Tables } from "@/db/types"
import { ContentType, DataListType } from "@/types"
import { FC, useState } from "react"
import { SidebarCreateButtons } from "./sidebar-create-buttons"
import { SidebarDataList } from "./sidebar-data-list"
import { SidebarSearch } from "./sidebar-search"
// import { ModelOption } from "../models/model-option"

interface SidebarContentProps {
  contentType: ContentType
  data: DataListType
  folders: Tables<"folders">[]
}

export const SidebarContent: FC<SidebarContentProps> = ({
  contentType,
  data,
  folders
}) => {
  // Static model choices reflecting Chat Settings dropdown
  const MODEL_CHOICES = [
    { modelId: 'o3-2025-04-16', modelName: 'o3-2025-04-16' },
    { modelId: 'gpt-4.1-2025-04-14', modelName: 'gpt-4.1-2025-04-14' }
  ]
  // Remove dynamic fetch usage
  const [searchTerm, setSearchTerm] = useState("")
  // removed dynamic model lists; using static MODEL_CHOICES
  // If models tab, show static model choices
  if (contentType === 'models') {
    const filtered = MODEL_CHOICES.filter(m =>
      m.modelName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return (
      <div className="flex max-h-[calc(100%-50px)] grow flex-col p-2">
        <div className="mt-2">
          <SidebarSearch contentType={contentType} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </div>
        <div className="overflow-auto">
          {filtered.map((m, idx) => (
            <div key={idx} className="mb-1 text-sm cursor-pointer hover:bg-gray-200 rounded p-1">
              {m.modelName}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Allow search
  const filteredData: any = data.filter(item =>
    (item.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Special handling for models tab
  if (contentType === 'models') {
    const models = [...availableHostedModels, ...availableLocalModels, ...availableOpenRouterModels]
    const filtModels = models.filter(m =>
      m.modelName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return (
      <div className="flex flex-col">
        <SidebarSearch contentType={contentType} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="overflow-auto flex flex-col">
          {filtModels.map((model, idx) => (
            <ModelOption key={idx} model={model} onSelect={() => setChatSettings({ ...chatSettings, model: model.modelId })} />
          ))}
        </div>
      </div>
    )
  }

  return (
    // Subtract 50px for the height of the workspace settings
    <div className="flex max-h-[calc(100%-50px)] grow flex-col">
      <div className="mt-2 flex items-center">
        <SidebarCreateButtons
          contentType={contentType}
          hasData={data.length > 0}
        />
      </div>

      <div className="mt-2">
        <SidebarSearch
          contentType={contentType}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>

      <SidebarDataList
        contentType={contentType}
        data={filteredData}
        folders={folders}
      />
    </div>
  )
}
