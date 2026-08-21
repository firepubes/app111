# ⚙️ Configuration Guide (`wrangler.toml`)

Before deploying or running MailTune, you must configure the `wrangler.toml` file located in the root of the project. This file tells Cloudflare how to route your emails, where to host your website, and which database to connect to.

Here is a step-by-step guide on how to fill it out:

---

### 1. Database Configuration (`database_id`)

```toml
[[d1_databases]]
binding = "DB"
database_name = "mailtune-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
- **What it is:** The unique identifier for your Cloudflare D1 Database.
- **How to get it:** 
  - If deploying via CLI, run `npm run db:create` and copy the ID from the terminal output.
  - If deploying via Dashboard, go to **Workers & Pages > D1**, create a database named `mailtune-db`, click on it, and copy the "Database ID".

---

### 2. Custom Domain Routes (`pattern`)

```toml
[[routes]]
pattern = "mailtune.YOURDOMAIN.com"
custom_domain = true
```
- **What it is:** The URL where your MailTune web interface will be accessible.
- **How to configure:** Replace `YOURDOMAIN.com` with your actual domain name. 
  - *Example:* If your domain is `google.com`, change it to `pattern = "mailtune.google.com"`.
  - You can change `mailtune` to anything you like (e.g., `temp.google.com` or `mail.google.com`), as long as it's a valid subdomain.

---

### 3. Environment Variables (`[vars]`)

```toml
[vars]
APP_NAME = "MailTune"
MAIL_DOMAIN = "YOURDOMAIN.com"
WEB_HOST = "mailtune.YOURDOMAIN.com"
```
- **`APP_NAME`**: The name of your application that will appear in the web UI (e.g., "MailTune", "My Temp Mail", etc.).
- **`MAIL_DOMAIN`**: The domain name used for the generated email addresses.
  - *Example:* If set to `example.com`, generated emails will look like `swiftfox@example.com`.
  - **Multiple Domains Support:** You can add multiple domains by separating them with a comma (e.g., `"example.com, mydomain.net"`). The frontend will automatically display a dropdown allowing users to select which domain they want to use!
  - These MUST be domains you own and have connected to Cloudflare with Email Routing enabled.
- **`WEB_HOST`**: The exact same URL you set in the `pattern` above. This is used by the frontend to know where it is hosted.
  - *Example:* `mailtune.example.com`
