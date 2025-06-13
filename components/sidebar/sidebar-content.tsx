import { Tables } from "@/db/types"
import { useContext } from "react"
import { ChatbotUIContext } from "@/context/context"
import { ContentType, DataListType } from "@/types"
import { FC, useState } from "react"
import { SidebarCreateButtons } from "./sidebar-create-buttons"
import { SidebarDataList } from "./sidebar-data-list"
import { SidebarSearch } from "./sidebar-search"

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
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData: any = data.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  )
  // Static model choices matching the dropdown
  const MODEL_CHOICES = [
    { modelId: 'o3-2025-04-16', modelName: 'o3-2025-04-16' },
    { modelId: 'gpt-4.1-2025-04-14', modelName: 'gpt-4.1-2025-04-14' }
  ]
  if (contentType === 'models') {
    const filteredModels = MODEL_CHOICES.filter(m =>
      m.modelName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return (
      <div className="flex max-h-[calc(100%-50px)] grow flex-col">
        <SidebarSearch contentType={contentType} searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="overflow-auto mt-2">
          {filteredModels.map((m, idx) => (
            <div key={idx} className="p-2 text-sm cursor-pointer hover:bg-gray-200">
              {m.modelName}
            </div>
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
