"use client"

import { ChatbotUIContext } from "@/context/context"
// DB interactions moved to API endpoints
import {
  fetchHostedModels,
  fetchOpenRouterModels
} from "@/lib/models/fetch-models"
// Supabase client removed; using local DB client
// Removed TablesUpdate type; not needed after migrating to API
import { useRouter } from "next/navigation"
import { useContext, useEffect, useState } from "react"
import { APIStep } from "../../../components/setup/api-step"
import { FinishStep } from "../../../components/setup/finish-step"
import { ProfileStep } from "../../../components/setup/profile-step"
import {
  SETUP_STEP_COUNT,
  StepContainer
} from "../../../components/setup/step-container"

export default function SetupPage() {
  const {
    profile,
    setProfile,
    setWorkspaces,
    setSelectedWorkspace,
    setEnvKeyMap,
    setAvailableHostedModels,
    setAvailableOpenRouterModels
  } = useContext(ChatbotUIContext)

  const router = useRouter()

  const [loading, setLoading] = useState(true)

  const [currentStep, setCurrentStep] = useState(1)

  // Profile Step
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState(profile?.username || "")
  const [usernameAvailable, setUsernameAvailable] = useState(true)

  // API Step
  const [useAzureOpenai, setUseAzureOpenai] = useState(false)
  const [openaiAPIKey, setOpenaiAPIKey] = useState("")
  const [openaiOrgID, setOpenaiOrgID] = useState("")
  const [azureOpenaiAPIKey, setAzureOpenaiAPIKey] = useState("")
  const [azureOpenaiEndpoint, setAzureOpenaiEndpoint] = useState("")
  const [azureOpenai35TurboID, setAzureOpenai35TurboID] = useState("")
  const [azureOpenai45TurboID, setAzureOpenai45TurboID] = useState("")
  const [azureOpenai45VisionID, setAzureOpenai45VisionID] = useState("")
  const [azureOpenaiEmbeddingsID, setAzureOpenaiEmbeddingsID] = useState("")
  const [anthropicAPIKey, setAnthropicAPIKey] = useState("")
  const [googleGeminiAPIKey, setGoogleGeminiAPIKey] = useState("")
  const [mistralAPIKey, setMistralAPIKey] = useState("")
  const [groqAPIKey, setGroqAPIKey] = useState("")
  const [perplexityAPIKey, setPerplexityAPIKey] = useState("")
  const [openrouterAPIKey, setOpenrouterAPIKey] = useState("")

  useEffect(() => {
    ;(async () => {
      try {
        // Load or create profile
        const profileRes = await fetch('/api/profile')
        if (!profileRes.ok) {
          setLoading(false)
          return
        }
        const profileData = await profileRes.json()
        setProfile(profileData)
        if (!profileData.has_onboarded) {
          setUsername(profileData.username || '')
          setLoading(false)
          return
        }
        setUsername(profileData.username)

        // Load model settings
        const hostedData = await fetchHostedModels(profileData)
        if (hostedData) {
          setEnvKeyMap(hostedData.envKeyMap)
          setAvailableHostedModels(hostedData.hostedModels)
          if (profileData.openrouter_api_key || hostedData.envKeyMap.openrouter) {
            const openRouterModels = await fetchOpenRouterModels()
            if (openRouterModels) setAvailableOpenRouterModels(openRouterModels)
          }
        }

        // Fetch or create home workspace
        const wsRes = await fetch('/api/workspaces')
        let workspaces = await wsRes.json()
        if (workspaces.length === 0) {
          const newRes = await fetch('/api/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: profileData.user_id,
              name: 'Home',
              description: 'Default workspace',
              default_context_length: 4096,
              default_model: 'gpt-4-turbo',
              default_prompt: 'You are a helpful AI assistant.',
              default_temperature: 0.5,
              include_profile_context: true,
              include_workspace_instructions: true,
              embeddings_provider: 'openai',
              is_home: true
            })
          })
          const defaultWs = await newRes.json()
          workspaces = [defaultWs]
        }
        const homeWorkspace = workspaces.find((w: any) => w.is_home) || workspaces[0]
        setSelectedWorkspace(homeWorkspace)
        setWorkspaces(workspaces)
        router.push(`/${homeWorkspace.id}/chat`)
      } catch (error) {
        console.error('Setup error:', error)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleShouldProceed = (proceed: boolean) => {
    if (proceed) {
      if (currentStep === SETUP_STEP_COUNT) {
        handleSaveSetupSetting()
      } else {
        setCurrentStep(currentStep + 1)
      }
    } else {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSaveSetupSetting = async () => {
    if (!profile) return
    try {
      // Update profile via API
      const updateRes = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: profile.id,
          has_onboarded: true,
          display_name: displayName,
          username,
          openai_api_key: openaiAPIKey,
          openai_organization_id: openaiOrgID,
          anthropic_api_key: anthropicAPIKey,
          google_gemini_api_key: googleGeminiAPIKey,
          mistral_api_key: mistralAPIKey,
          groq_api_key: groqAPIKey,
          perplexity_api_key: perplexityAPIKey,
          openrouter_api_key: openrouterAPIKey,
          use_azure_openai: useAzureOpenai,
          azure_openai_api_key: azureOpenaiAPIKey,
          azure_openai_endpoint: azureOpenaiEndpoint,
          azure_openai_35_turbo_id: azureOpenai35TurboID,
          azure_openai_45_turbo_id: azureOpenai45TurboID,
          azure_openai_45_vision_id: azureOpenai45VisionID,
          azure_openai_embeddings_id: azureOpenaiEmbeddingsID
        })
      })
      if (!updateRes.ok) throw new Error('Failed to save profile')
      const updatedProfile = await updateRes.json()
      setProfile(updatedProfile)

      // Refresh workspaces and redirect
      const wsRes = await fetch('/api/workspaces')
      const workspaces = await wsRes.json()
      const homeWorkspace = workspaces.find((w: any) => w.is_home) || workspaces[0]
      setSelectedWorkspace(homeWorkspace)
      setWorkspaces(workspaces)
      router.push(`/${homeWorkspace.id}/chat`)
    } catch (error) {
      console.error('Save setup error:', error)
    }
  }

  const renderStep = (stepNum: number) => {
    switch (stepNum) {
      // Profile Step
      case 1:
        return (
          <StepContainer
            stepDescription="Let's create your profile."
            stepNum={currentStep}
            stepTitle="Welcome to Chatbot UI"
            onShouldProceed={handleShouldProceed}
            showNextButton={!!(username && usernameAvailable)}
            showBackButton={false}
          >
            <ProfileStep
              username={username}
              usernameAvailable={usernameAvailable}
              displayName={displayName}
              onUsernameAvailableChange={setUsernameAvailable}
              onUsernameChange={setUsername}
              onDisplayNameChange={setDisplayName}
            />
          </StepContainer>
        )

      // API Step
      case 2:
        return (
          <StepContainer
            stepDescription="Enter API keys for each service you'd like to use."
            stepNum={currentStep}
            stepTitle="Set API Keys (optional)"
            onShouldProceed={handleShouldProceed}
            showNextButton={true}
            showBackButton={true}
          >
            <APIStep
              openaiAPIKey={openaiAPIKey}
              openaiOrgID={openaiOrgID}
              azureOpenaiAPIKey={azureOpenaiAPIKey}
              azureOpenaiEndpoint={azureOpenaiEndpoint}
              azureOpenai35TurboID={azureOpenai35TurboID}
              azureOpenai45TurboID={azureOpenai45TurboID}
              azureOpenai45VisionID={azureOpenai45VisionID}
              azureOpenaiEmbeddingsID={azureOpenaiEmbeddingsID}
              anthropicAPIKey={anthropicAPIKey}
              googleGeminiAPIKey={googleGeminiAPIKey}
              mistralAPIKey={mistralAPIKey}
              groqAPIKey={groqAPIKey}
              perplexityAPIKey={perplexityAPIKey}
              useAzureOpenai={useAzureOpenai}
              onOpenaiAPIKeyChange={setOpenaiAPIKey}
              onOpenaiOrgIDChange={setOpenaiOrgID}
              onAzureOpenaiAPIKeyChange={setAzureOpenaiAPIKey}
              onAzureOpenaiEndpointChange={setAzureOpenaiEndpoint}
              onAzureOpenai35TurboIDChange={setAzureOpenai35TurboID}
              onAzureOpenai45TurboIDChange={setAzureOpenai45TurboID}
              onAzureOpenai45VisionIDChange={setAzureOpenai45VisionID}
              onAzureOpenaiEmbeddingsIDChange={setAzureOpenaiEmbeddingsID}
              onAnthropicAPIKeyChange={setAnthropicAPIKey}
              onGoogleGeminiAPIKeyChange={setGoogleGeminiAPIKey}
              onMistralAPIKeyChange={setMistralAPIKey}
              onGroqAPIKeyChange={setGroqAPIKey}
              onPerplexityAPIKeyChange={setPerplexityAPIKey}
              onUseAzureOpenaiChange={setUseAzureOpenai}
              openrouterAPIKey={openrouterAPIKey}
              onOpenrouterAPIKeyChange={setOpenrouterAPIKey}
            />
          </StepContainer>
        )

      // Finish Step
      case 3:
        return (
          <StepContainer
            stepDescription="You are all set up!"
            stepNum={currentStep}
            stepTitle="Setup Complete"
            onShouldProceed={handleShouldProceed}
            showNextButton={true}
            showBackButton={true}
          >
            <FinishStep displayName={displayName} />
          </StepContainer>
        )
      default:
        return null
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="flex h-full items-center justify-center">
      {renderStep(currentStep)}
    </div>
  )
}
