/**
 * The Upper Room Collective — website form → Google Sheet.
 *
 * Paste this into the Apps Script editor of the spreadsheet that should collect
 * submissions (Extensions → Apps Script), then deploy it as a web app.
 * Full steps: integrations/google-sheets/README.md in the website repo.
 *
 * Each form writes to a tab named after its hidden "form" field (e.g. "Interest").
 * The tab and its header row are created automatically; new fields added on the
 * website become new columns. Columns you add by hand are left alone.
 * Fields with several values (checkbox groups) are saved comma-separated in one cell.
 */

const HONEYPOT = "company"; // hidden field real people never fill in
const SKIP = ["form", HONEYPOT]; // fields not written as columns
const MAX_LENGTH = 5000; // per value, to keep junk out of the sheet

function doPost(e) {
  // e.parameters keeps every value of repeated fields (checkboxes); join them.
  const raw = (e && e.parameters) || {};
  const params = {};
  Object.keys(raw).forEach((key) => {
    params[key] = [].concat(raw[key]).join(", ");
  });

  // Spam: pretend it worked so bots don't retry.
  if (params[HONEYPOT]) return json({ ok: true });

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const sheet = sheetFor(params.form || "Submissions");
    const headers = ensureHeaders(sheet, params);

    const row = headers.map((header) => {
      if (header === "Submitted at") return new Date();
      const value = params[header];
      return value === undefined ? "" : clean(value);
    });
    sheet.appendRow(row);
    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "Could not save the submission." });
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser just confirms it's running.
function doGet() {
  return json({ ok: true, message: "Form endpoint is running." });
}

function sheetFor(name) {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const safeName = String(name).slice(0, 90);
  return book.getSheetByName(safeName) || book.insertSheet(safeName);
}

function ensureHeaders(sheet, params) {
  const lastColumn = sheet.getLastColumn();
  const headers = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String) : [];
  if (!headers.includes("Submitted at")) headers.unshift("Submitted at");

  Object.keys(params).forEach((key) => {
    if (!SKIP.includes(key) && !headers.includes(key)) headers.push(key);
  });

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
  sheet.setFrozenRows(1);
  return headers;
}

// Stops values like "=IMPORTXML(...)" from running as formulas in the sheet.
function clean(value) {
  const text = String(value).slice(0, MAX_LENGTH);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
