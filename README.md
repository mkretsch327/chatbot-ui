# Chatbot UI

The open-source AI chat app for everyone.

<img src="./public/readme/screenshot.png" alt="Chatbot UI" width="600">

## Demo

View the latest demo [here](https://x.com/mckaywrigley/status/1738273242283151777?s=20).

## Updates

Hey everyone! I've heard your feedback and am working hard on a big update.

Things like simpler deployment, better backend compatibility, and improved mobile layouts are on their way.

Be back soon.

-- Mckay

## Official Hosted Version

Use Chatbot UI without having to host it yourself!

Find the official hosted version of Chatbot UI [here](https://chatbotui.com).

## Sponsor

If you find Chatbot UI useful, please consider [sponsoring](https://github.com/sponsors/mckaywrigley) me to support my open-source work :)

## Issues

We restrict "Issues" to actual issues related to the codebase.

We're getting excessive amounts of issues that amount to things like feature requests, cloud provider issues, etc.

If you are having issues with things like setup, please refer to the "Help" section in the "Discussions" tab above.

Issues unrelated to the codebase will likely be closed immediately.

## Discussions

We highly encourage you to participate in the "Discussions" tab above!

Discussions are a great place to ask questions, share ideas, and get help.

Odds are if you have a question, someone else has the same question.

## Legacy Code

Chatbot UI was recently updated to its 2.0 version.

The code for 1.0 can be found on the `legacy` branch.

## Updating

In your terminal at the root of your local Chatbot UI repository, run:

```bash
npm run update
```

If you run a hosted instance you'll also need to run:

```bash
npm run db-push
```

to apply the latest migrations to your live database.

## Local Quickstart

Follow these steps to get your own Chatbot UI instance running locally.

### 1. Clone the Repo
```bash
git clone https://github.com/mckaywrigley/chatbot-ui.git
cd chatbot-ui
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.local.example .env.local
```
Open `.env.local` and set:
  - DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
  - LOCAL_USER_ID=<a stable UUID for your user>
  - Optionally add any LLM API keys (OPENAI_API_KEY, etc.)

### 4. Ensure Postgres is Running
Start your Postgres server and create the database if needed:
```bash
createdb <database>
```

### 5. Create & Seed the Database
```bash
npm run migrate
npm run seed
```

### 6. Run the App
```bash
npm run dev
```

Open your browser at `http://localhost:3000/en/setup` (replace `en` with your locale) to finish onboarding and start chatting.

## Hosted Quickstart

Follow these steps to get your own Chatbot UI instance running in the cloud.

Video tutorial coming soon.

### 1. Follow Local Quickstart

Repeat steps 1-4 in "Local Quickstart" above.

You will want separate repositories for your local and hosted instances.

Create a new repository for your hosted instance of Chatbot UI on GitHub and push your code to it.

### 2. Setup Backend with Supabase

#### 1. Create a new project

Go to [Supabase](https://supabase.com/) and create a new project.

#### 2. Get Project Values

Once you are in the project dashboard, click on the "Project Settings" icon tab on the far bottom left.

Here you will get the values for the following environment variables:

- `Project Ref`: Found in "General settings" as "Reference ID"

- `Project ID`: Found in the URL of your project dashboard (Ex: https://supabase.com/dashboard/project/<YOUR_PROJECT_ID>/settings/general)

While still in "Settings" click on the "API" text tab on the left.

Here you will get the values for the following environment variables:

- `Project URL`: Found in "API Settings" as "Project URL"

- `Anon key`: Found in "Project API keys" as "anon public"

- `Service role key`: Found in "Project API keys" as "service_role" (Reminder: Treat this like a password!)

#### 3. Configure Auth

Next, click on the "Authentication" icon tab on the far left.

In the text tabs, click on "Providers" and make sure "Email" is enabled.

We recommend turning off "Confirm email" for your own personal instance.

#### 4. Connect to Hosted DB

Open up your repository for your hosted instance of Chatbot UI.

In the 1st migration file `supabase/migrations/20240108234540_setup.sql` you will need to replace 2 values with the values you got above:

- `project_url` (line 53): Use the `Project URL` value from above
- `service_role_key` (line 54): Use the `Service role key` value from above

Now, open a terminal in the root directory of your local Chatbot UI repository. We will execute a few commands here.

Login to Supabase by running:

```bash
supabase login
```

Next, link your project by running the following command with the "Project ID" you got above:

```bash
supabase link --project-ref <project-id>
```

Your project should now be linked.

Finally, push your database to Supabase by running:

```bash
supabase db push
```

Your hosted database should now be set up!

### 3. Setup Frontend with Vercel

Go to [Vercel](https://vercel.com/) and create a new project.

In the setup page, import your GitHub repository for your hosted instance of Chatbot UI. Within the project Settings, in the "Build & Development Settings" section, switch Framework Preset to "Next.js".

In environment variables, add the following from the values you got above:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_OLLAMA_URL` (only needed when using local Ollama models; default: `http://localhost:11434`)

You can also add API keys as environment variables.

- `OPENAI_API_KEY`
- `AZURE_OPENAI_API_KEY`
- `AZURE_OPENAI_ENDPOINT`
- `AZURE_GPT_45_VISION_NAME`

For the full list of environment variables, refer to the '.env.local.example' file. If the environment variables are set for API keys, it will disable the input in the user settings.

Click "Deploy" and wait for your frontend to deploy.

Once deployed, you should be able to use your hosted instance of Chatbot UI via the URL Vercel gives you.

## Contributing

We are working on a guide for contributing.

## Contact

Message Mckay on [Twitter/X](https://twitter.com/mckaywrigley)
