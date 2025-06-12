-- Seed data for Chatbot UI

-- Single-user identity
-- Use a fixed UUID for simplicity
\set user_id '11111111-1111-1111-1111-111111111111'
\set profile_id '11111111-1111-1111-1111-222222222222'
\set workspace_id '11111111-1111-1111-1111-333333333333'
\set chat_id '11111111-1111-1111-1111-444444444444'

-- Profile
INSERT INTO profiles (id, user_id, username, display_name, has_onboarded, created_at)
VALUES (:profile_id, :user_id, 'user', 'User', true, now());

-- Default workspace
INSERT INTO workspaces (id, user_id, name, description, default_model, default_prompt,
  default_temperature, default_context_length, include_profile_context,
  include_workspace_instructions, embeddings_provider, is_home, created_at)
VALUES (:workspace_id, :user_id, 'Home', 'Default workspace',
  'gpt-4-turbo', 'You are a helpful AI assistant.',
  0.5, 4096, true, true, 'openai', true, now());

-- Initial chat
INSERT INTO chats (id, user_id, workspace_id, name, model, prompt, temperature,
  context_length, include_profile_context, include_workspace_instructions,
  embeddings_provider, created_at)
VALUES (:chat_id, :user_id, :workspace_id, 'First Chat',
  'gpt-4-turbo', 'You are a helpful AI assistant.',
  0.5, 4096, true, true, 'openai', now());

-- Initial message
INSERT INTO messages (id, user_id, chat_id, content, role, model, sequence_number, created_at)
VALUES (gen_random_uuid(), :user_id, :chat_id,
  'Welcome to Chatbot UI! This is your first message.', 'assistant',
  'gpt-4-turbo', 0, now());