-- Schema for Chatbot UI local Postgres database

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  has_onboarded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Workspaces
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_model TEXT,
  default_prompt TEXT,
  default_temperature REAL,
  default_context_length INT,
  include_profile_context BOOLEAN,
  include_workspace_instructions BOOLEAN,
  embeddings_provider TEXT,
  is_home BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Chats
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT,
  model TEXT,
  prompt TEXT,
  temperature REAL,
  context_length INT,
  include_profile_context BOOLEAN,
  include_workspace_instructions BOOLEAN,
  embeddings_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  content TEXT,
  role TEXT,
  model TEXT,
  sequence_number INT,
  tokens INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Collections and join
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE collection_workspaces (
  user_id UUID NOT NULL,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, collection_id, workspace_id)
);

-- Assistants and join
CREATE TABLE assistants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  description TEXT,
  model TEXT,
  prompt TEXT,
  temperature REAL,
  context_length INT,
  include_profile_context BOOLEAN,
  include_workspace_instructions BOOLEAN,
  embeddings_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE assistant_workspaces (
  user_id UUID NOT NULL,
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, assistant_id, workspace_id)
);
CREATE TABLE assistant_collections (
  user_id UUID NOT NULL,
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, assistant_id, collection_id)
);
CREATE TABLE assistant_files (
  user_id UUID NOT NULL,
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, assistant_id, file_id)
);
CREATE TABLE assistant_tools (
  user_id UUID NOT NULL,
  assistant_id UUID NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, assistant_id, tool_id)
);

-- Files and join
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  description TEXT,
  file_path TEXT,
  size BIGINT,
  tokens INT,
  type TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE file_workspaces (
  user_id UUID NOT NULL,
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, file_id, workspace_id)
);

-- File items (for retrieval)
CREATE TABLE file_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  local_embedding vector(384),
  openai_embedding vector(1536),
  tokens INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- Message-file items join
CREATE TABLE message_file_items (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  file_item_id UUID NOT NULL REFERENCES file_items(id) ON DELETE CASCADE,
  PRIMARY KEY (message_id, file_item_id)
);

-- Tools and join
CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE tool_workspaces (
  user_id UUID NOT NULL,
  tool_id UUID NOT NULL REFERENCES tools(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, tool_id, workspace_id)
);

-- Models and join
CREATE TABLE models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE model_workspaces (
  user_id UUID NOT NULL,
  model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, model_id, workspace_id)
);

-- Prompts and join
CREATE TABLE prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE prompt_workspaces (
  user_id UUID NOT NULL,
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, prompt_id, workspace_id)
);

-- Presets and join
CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT,
  prompt TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);
CREATE TABLE preset_workspaces (
  user_id UUID NOT NULL,
  preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, preset_id, workspace_id)
);

-- Folders
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);