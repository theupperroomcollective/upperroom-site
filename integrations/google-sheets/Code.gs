/** Website forms: keep Interest and Feedback responses in separate sheet tabs. */
const BOOK_ID = '1OR81vizK-uNMihNPKq9UBhEAQwYqG8cY-MEDK4giTNs';
const NOTIFICATION_EMAIL = 'tanya@the5collective.org';
const FORMS = {
  Interest: ['name', 'business', 'email', 'phone', 'website', 'linkedin', 'interests', 'building', 'consent', 'page', 'job_title', 'journey'],
  Feedback: ['name', 'email', 'value', 'relevance', 'takeaway', 'preparedness', 'improvements', 'fair_price', 'paid_return', 'experiences', 'priority', 'future_topic', 'recommendation', 'follow_up', 'additional_feedback', 'page']
};
const REQUIRED_FEEDBACK = ['name', 'email', 'value', 'relevance', 'takeaway', 'preparedness', 'fair_price', 'paid_return', 'experiences', 'priority', 'recommendation'];
function doGet() { return json({ok: true}); }
function doPost(e) {
  const p = (e && e.parameters) || {};
  const value = key => (p[key] || []).join(', ').trim();
  if (value('company')) return json({ok: true});
  const formName = value('form') || 'Interest';
  const fields = FORMS[formName];
  if (!fields) return json({ok: false, error: 'Unknown form.'});
  const required = formName === 'Feedback' ? REQUIRED_FEEDBACK : ['name', 'email', 'consent'];
  if (required.some(key => !value(key)) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value('email'))) {
    return json({ok: false, error: 'Please complete the required fields.'});
  }
  if (formName === 'Feedback' && !/^(10|[0-9])$/.test(value('recommendation'))) {
    return json({ok: false, error: 'Please choose a recommendation score from 0 to 10.'});
  }
  const lock = LockService.getScriptLock();
  let acquired = false;
  try {
    lock.waitLock(10000);
    acquired = true;
    const book = SpreadsheetApp.openById(BOOK_ID);
    const sheet = book.getSheetByName(formName) || book.insertSheet(formName);
    const count = sheet.getLastColumn();
    const headers = count ? sheet.getRange(1, 1, 1, count).getValues()[0].map(String) : ['Submitted at'];
    fields.forEach(key => { if (!headers.includes(key)) headers.push(key); });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.appendRow(headers.map(key => key === 'Submitted at' ? new Date() : clean(value(key))));
    SpreadsheetApp.flush();
  } catch (error) {
    console.error(error);
    return json({ok: false, error: 'Could not save the submission.'});
  } finally {
    if (acquired) lock.releaseLock();
  }
  try {
    MailApp.sendEmail({
      to: NOTIFICATION_EMAIL,
      subject: formName === 'Feedback' ? 'New master class feedback — The Upper Room Collective' : 'New website interest submission — The Upper Room Collective',
      body: 'A new ' + formName.toLowerCase() + ' response has been saved to your spreadsheet.\n\n' + fields.map(key => key + ': ' + value(key).slice(0, 5000)).join('\n\n') + '\n\nView responses: https://docs.google.com/spreadsheets/d/' + BOOK_ID + '/edit',
      name: 'The Upper Room Collective'
    });
  } catch (mailError) { console.error('Response saved, but email notification failed: ' + mailError); }
  return json({ok: true});
}
function clean(value) {
  const text = String(value).slice(0, 5000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function json(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
