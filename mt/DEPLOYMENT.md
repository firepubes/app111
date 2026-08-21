# 🚀 Deploy via IDE / Terminal Guide

If you want to deploy (publish) the project to the internet directly from your computer using your IDE's terminal (like VSCode), Command Prompt, or standard Terminal, follow this guide.

## Prerequisites
1. You have created a Cloudflare account.
2. You have a domain connected to Cloudflare.
3. Node.js and NPM are installed.
4. You have configured the environment variables `APP_NAME`, `MAIL_DOMAIN`, and `WEB_HOST` in the `wrangler.toml` file, and updated the domain pattern under `[[routes]]`.

---

## Step 1: Login to Cloudflare via Terminal

Run this command in the project's root terminal:
```bash
npx wrangler login
```
*This command will open a browser tab. Please log in to your Cloudflare account and click "Allow" to grant Wrangler access.*

To ensure you are successfully logged in, run:
```bash
npx wrangler whoami
```

---

## Step 2: Create a D1 Database on Cloudflare

This application requires a database to store data. We will create a production (remote) database on Cloudflare servers.

Run this command:
```bash
npm run db:create
```

You will see an output similar to this:
```text
✅ Successfully created DB 'mailtune-db'

[[d1_databases]]
binding = "DB"
database_name = "mailtune-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**CRITICAL:** 
Open the `wrangler.toml` file in your code editor, find the `[[d1_databases]]` section. Copy the generated ID (e.g., `xxxxxxxx-xxxx-xxxx-...`) and paste it into the `database_id = ""` field.

---

## Step 3: Setup Database Tables

Now, let's create the table structure in the production database we just created.

Run this command:
```bash
npm run db:migrate
```
*This command reads the `src/db/schema.sql` file and executes it directly on the Cloudflare server.*

---

## Step 4: Deployment Process

Everything is ready. It's time to deploy both the frontend and backend together!

Run this command:
```bash
npm run deploy
```

**What happens when you run this command?**
1. The system builds the React Vite code in the `frontend` folder into static HTML files.
2. Uploads the static files to Cloudflare Assets.
3. Uploads the Worker script (backend).
4. Binds the worker to the domain/route you configured in `wrangler.toml`.

If successful, you will see your application's public URL in the terminal.

---

## Step 5: Setup Email Routing (Cloudflare Dashboard)

Finally, for the application to receive emails, you must configure Cloudflare Email Routing.

1. Open the [Cloudflare Dashboard](https://dash.cloudflare.com).
2. Select your domain.
3. Go to the **Email** -> **Email Routing** menu.
4. In the **Routing Rules** tab, enable the **Catch-all address**.
5. Set the _Action_ to **Send to a Worker**.
6. Select the Worker you just deployed (usually named `mailtune`).
7. Save the settings.

Done! Open your domain, create a random inbox, and send a test email to it.
