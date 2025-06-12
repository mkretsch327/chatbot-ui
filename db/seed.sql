-- Seed data for Chatbot UI

-- Single-user identity
-- Use a fixed UUID for simplicity

-- Profile
INSERT INTO profiles (id, user_id, username, display_name, has_onboarded, created_at)
VALUES (
  '11111111-1111-1111-1111-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'user',
  'User',
  true,
  now()
);

-- Default workspace
INSERT INTO workspaces (
  id,
  user_id,
  name,
  description,
  default_model,
  default_prompt,
  default_temperature,
  default_context_length,
  include_profile_context,
  include_workspace_instructions,
  embeddings_provider,
  is_home,
  created_at
) VALUES (
  '11111111-1111-1111-1111-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'Home',
  'Default workspace',
  'gpt-4o',
  'You are a helpful AI assistant.',
  0.4,
  4096,
  true,
  true,
  'openai',
  true,
  now()
);

-- Initial chat
INSERT INTO chats (id, user_id, workspace_id, name, model, prompt, temperature,
  context_length, include_profile_context, include_workspace_instructions,
  embeddings_provider, created_at)
VALUES (
  '11111111-1111-1111-1111-444444444444',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-333333333333',
  'First Chat',
  'gpt-4o',
  'You are a helpful AI assistant, and an expert-level data scientist.',
  0.4,
  4096,
  true,
  true,
  'openai',
  now()
);

-- Initial message
INSERT INTO messages (
  id, user_id, chat_id, content, role, model, sequence_number, created_at
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-444444444444',
  'Welcome to Chatbot UI! This is your first message.',
  'assistant',
  'gpt-4o',
  0,
  now()
);