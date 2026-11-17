# Website forms → Google Sheets

Forms built with `SheetForm` (for example the `/interest` landing page) send each
submission to a small Google Apps Script attached to a spreadsheet. The script adds
one row per submission. No other service or API key is involved.

## One-time setup (about 5 minutes)

1. Create (or open) the Google Sheet that should collect submissions, signed in to
   the account that should own the data.
2. **Extensions → Apps Script.** Delete the sample code, paste in everything from
   [`Code.gs`](./Code.gs), and save.
3. **Deploy → New deployment.** Click the gear and choose **Web app**.
   - Description: `Website forms`
   - Execute as: **Me**
   - Who has access: **Anyone** (the site's visitors need to be able to post; they
     can't read the sheet)
4. Click **Deploy**, approve the permissions Google asks for, and copy the
   **Web app URL** (it ends in `/exec`).
5. Put that URL in the `PUBLIC_SHEETS_ENDPOINT` environment variable:
   - In Vercel: Project → Settings → Environment Variables (Production and Preview), then redeploy.
   - Locally: add `PUBLIC_SHEETS_ENDPOINT=<url>` to `.env` and restart `npm run dev`.

Visiting the URL in a browser should show `{"ok":true,"message":"Form endpoint is running."}`.

## How rows are written

- Each form writes to a tab named after its `form.name` in the content file
  (the landing page uses **Interest**). The tab is created on the first submission.
- Row 1 holds the headers: **Submitted at**, then each field's `name`, then `page`
  (the URL path the form was sent from). A new field on the website becomes a new
  column automatically. Renaming a field starts a new column; the old one stays.
- Submissions that fill in the hidden honeypot field are dropped as spam.

## Changing the script later

After editing `Code.gs` in Apps Script, use **Deploy → Manage deployments → Edit →
Version: New version**. That keeps the same URL. Creating a *new deployment* gives a
new URL, which would then need updating in Vercel.
