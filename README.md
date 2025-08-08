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

## Matt Local
1) Run pgvector locally:  docker run --env-file .env.local --name pg -p 5432:5432 <pg image>
2) Separate terminal: 
- npm run migrate
- npm run seed
- npm run dev


## Contributing

We are working on a guide for contributing.

## Contact

Message Mckay on [Twitter/X](https://twitter.com/mckaywrigley)
