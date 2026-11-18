/** Website forms: native Google Forms responses, spreadsheet copies, and email. */
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
  if (!Object.prototype.hasOwnProperty.call(FORMS, formName)) return json({ok: false, error: 'Unknown form.'});
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
    const submissionId = value('submission_id') || Utilities.getUuid();
    const idColumn = headers.indexOf('submission_id');
    if (idColumn >= 0 && sheet.getLastRow() > 1 && sheet.getRange(2, idColumn + 1, sheet.getLastRow() - 1, 1).createTextFinder(submissionId).matchEntireCell(true).findNext()) return json({ok: true});
    const formResponseId = saveGoogleFormResponse(formName, p, submissionId);
    fields.concat(['Google Forms response id', 'submission_id']).forEach(key => { if (!headers.includes(key)) headers.push(key); });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
    sheet.setFrozenRows(1);
    sheet.appendRow(headers.map(key => key === 'Submitted at' ? new Date() : key === 'Google Forms response id' ? formResponseId : key === 'submission_id' ? submissionId : clean(value(key))));
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

const GOOGLE_FORM_DEFINITIONS = {
  "Interest": {
    "title": "The Upper Room Collective | Interest",
    "description": "Connect with a community of faith-driven founders, funders and builders. Tell us a little about yourself and we’ll keep you up to date on what’s next.",
    "success": "Thank you. You’re connected. Watch your inbox for updates on what’s next.",
    "fields": [
      {
        "name": "name",
        "label": "Name",
        "type": "text",
        "autocomplete": "name",
        "required": true
      },
      {
        "name": "email",
        "label": "Email address",
        "type": "email",
        "autocomplete": "email",
        "required": true,
        "half": true
      },
      {
        "name": "phone",
        "label": "Phone",
        "type": "tel",
        "autocomplete": "tel",
        "required": true,
        "half": true
      },
      {
        "name": "business",
        "label": "Company name",
        "type": "text",
        "autocomplete": "organization",
        "required": true,
        "half": true
      },
      {
        "name": "job_title",
        "label": "What is your job title?",
        "type": "text",
        "autocomplete": "organization-title",
        "required": true,
        "half": true
      },
      {
        "name": "website",
        "label": "Website",
        "type": "url",
        "autocomplete": "url",
        "required": false,
        "half": true
      },
      {
        "name": "linkedin",
        "label": "LinkedIn",
        "type": "url",
        "autocomplete": "off",
        "required": true,
        "half": true
      },
      {
        "name": "journey",
        "label": "Where are you in your founder journey?",
        "type": "select",
        "required": true,
        "options": [
          "I’m exploring entrepreneurship and finding my next idea.",
          "I have an idea or a problem I want to explore.",
          "I’m testing an idea or building an early version.",
          "I’ve launched and am growing a venture.",
          "I’m joining as an operator, investor, or supporter of founders."
        ]
      },
      {
        "name": "interests",
        "label": "I would like…",
        "type": "checkboxes",
        "required": true,
        "options": [
          "To stay updated on all events",
          "To join the Run Club",
          "To be invited to the next Founder Masterclass",
          "To sign up for the Founder Design Studio",
          "Consulting services"
        ]
      },
      {
        "name": "building",
        "label": "What are you building, exploring, or interested in backing?",
        "hint": "In one or two sentences, share a venture, a problem, or a sector you’re interested in. If you’re funding or supporting founders, tell us what kinds of ventures or stages you’re looking for.",
        "type": "textarea",
        "required": false
      },
      {
        "name": "consent",
        "label": "I agree to receive emails and updates from The Upper Room Collective. I can unsubscribe at any time. Read our [Privacy Policy](/privacy).",
        "type": "consent",
        "required": true
      }
    ]
  },
  "Feedback": {
    "title": "Founder Master Class | Experience & Feedback",
    "description": "Thank you for joining us!\n\nAs one of our earliest participants, you’re helping shape The Upper Room Collective, a new faith-driven accelerator ecosystem for the world’s next unicorn founders.\n\nWe’d love your feedback on what worked, what you need next, and how we can make every session more valuable.\n\nJust 3-4 minutes. Your insights help us build better.",
    "success": "Thank you for helping us build what doesn’t exist yet!\n\nYour feedback is helping shape the next chapter of The Upper Room Collective.\n\nWe’re grateful to have you among our earliest founders and can’t wait to see what you build.",
    "fields": [
      {
        "name": "name",
        "label": "1. Full name",
        "type": "text",
        "required": true,
        "section": "Section 1 - About you",
        "autocomplete": "name"
      },
      {
        "name": "email",
        "label": "2. Email address",
        "type": "email",
        "required": true,
        "hint": "Please use the email address you registered with.",
        "autocomplete": "email"
      },
      {
        "name": "value",
        "label": "3. How valuable was this master class to you?",
        "type": "radio",
        "required": true,
        "options": [
          "1 - Not valuable",
          "2 - Slightly valuable",
          "3 - Moderately valuable",
          "4 - Very valuable",
          "5 - Extremely valuable"
        ],
        "section": "Section 2 - Your experience"
      },
      {
        "name": "relevance",
        "label": "4. How relevant was this topic to your current founder journey?",
        "type": "radio",
        "required": true,
        "options": [
          "1 - Not relevant",
          "2 - Slightly relevant",
          "3 - Moderately relevant",
          "4 - Very relevant",
          "5 - Extremely relevant"
        ]
      },
      {
        "name": "takeaway",
        "label": "5. What was your biggest takeaway from this master class?",
        "type": "textarea",
        "required": true,
        "hint": "One insight, mindset shift or practical action you’re taking away."
      },
      {
        "name": "preparedness",
        "label": "6. How prepared do you feel to take your idea or business forward after this session?",
        "type": "radio",
        "required": true,
        "options": [
          "Much more prepared",
          "Somewhat more prepared",
          "About the same",
          "Less prepared",
          "Not applicable to my stage"
        ]
      },
      {
        "name": "improvements",
        "label": "7. What would have made this session even more valuable?",
        "type": "textarea",
        "required": false
      },
      {
        "name": "fair_price",
        "label": "8. What would you consider a fair price for a future live master class of this quality?",
        "type": "radio",
        "required": true,
        "options": [
          "Under $15",
          "$15-$25",
          "$26-$50",
          "$51-$75",
          "$76-$100",
          "Over $100",
          "I would only attend if free"
        ],
        "hint": "USD",
        "section": "Section 3 - Future demand & opportunities"
      },
      {
        "name": "paid_return",
        "label": "9. How likely would you be to register for another paid Founder Master Class on a topic relevant to you?",
        "type": "radio",
        "required": true,
        "options": [
          "Definitely would",
          "Likely",
          "Unsure",
          "Unlikely",
          "Definitely would not"
        ]
      },
      {
        "name": "experiences",
        "label": "10. Which Upper Room Collective experiences would you be most interested in?",
        "type": "checkboxes",
        "required": true,
        "options": [
          "Founder Master Classes - practical learning",
          "Founder Design Studio - strategy and consulting",
          "Founder Run Club - wellness and community",
          "Founder Dinners - curated connections",
          "Founder Podcast - stories and insights"
        ],
        "hint": "Select all that apply."
      },
      {
        "name": "priority",
        "label": "11. What is your biggest priority or challenge as a founder right now?",
        "type": "radio",
        "required": true,
        "options": [
          "Validating my business idea",
          "Building my product or service",
          "Finding customers and growing revenue",
          "Brand positioning and go-to-market",
          "Funding and investor readiness",
          "Building the right team and partnerships",
          "Scaling systems and operations",
          "Other"
        ]
      },
      {
        "name": "future_topic",
        "label": "12. Which topic would you most like us to cover in a future master class?",
        "type": "text",
        "required": false
      },
      {
        "name": "recommendation",
        "label": "13. How likely are you to recommend this master class to another founder?",
        "type": "radio",
        "required": true,
        "options": [
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "10"
        ],
        "hint": "0 = Not at all likely · 10 = Extremely likely"
      },
      {
        "name": "follow_up",
        "label": "14. Would you be open to sharing a short testimonial or speaking with our team about your experience?",
        "type": "radio",
        "required": false,
        "options": [
          "Yes, happy to share!",
          "Maybe - feel free to reach out",
          "Not right now"
        ],
        "section": "Section 4 - Optional follow-up"
      },
      {
        "name": "additional_feedback",
        "label": "15. Is there anything else you’d like us to know, or an opportunity we could help you unlock?",
        "type": "textarea",
        "required": false,
        "hint": "Ideas, unmet needs, introductions, collaboration opportunities or other feedback."
      }
    ]
  }
};

function setupGoogleForms() {
  const properties = PropertiesService.getScriptProperties();
  Object.keys(GOOGLE_FORM_DEFINITIONS).forEach(name => {
    const key = 'GOOGLE_FORM_' + name;
    let config = JSON.parse(properties.getProperty(key) || 'null');
    if (!config) {
      const definition = GOOGLE_FORM_DEFINITIONS[name];
      const form = FormApp.create(definition.title, true);
      form.setDescription(definition.description).setConfirmationMessage(definition.success).setPublishingSummary(false).setAllowResponseEdits(false);
      const items = {};
      definition.fields.forEach(field => {
        if (field.section) form.addSectionHeaderItem().setTitle(field.section);
        let item;
        if (field.name === 'recommendation') item = form.addScaleItem().setBounds(0, 10).setLabels('Not at all likely', 'Extremely likely');
        else if (field.type === 'checkboxes') item = form.addCheckboxItem().setChoiceValues(field.options);
        else if (field.type === 'radio' || field.type === 'select') item = form.addMultipleChoiceItem().setChoiceValues(field.options);
        else if (field.type === 'consent') item = form.addCheckboxItem().setChoiceValues(['Yes']);
        else if (field.type === 'textarea') item = form.addParagraphTextItem();
        else item = form.addTextItem();
        item.setTitle(field.label).setRequired(field.required);
        if (field.hint) item.setHelpText(field.hint);
        if (field.type === 'email') item.setValidation(FormApp.createTextValidation().requireTextIsEmail().build());
        items[field.name] = {id: item.getId(), type: field.name === 'recommendation' ? 'scale' : field.type};
      });
      config = {id: form.getId(), items: items};
      properties.setProperty(key, JSON.stringify(config));
    }
    const form = FormApp.openById(config.id);
    console.log(name + ' Google Form: ' + form.getEditUrl());
    console.log(name + ' native response count: ' + form.getResponses().length);
  });
}
function saveGoogleFormResponse(name, params, submissionId) {
  const config = JSON.parse(PropertiesService.getScriptProperties().getProperty('GOOGLE_FORM_' + name) || 'null');
  if (!config) throw new Error('Google Forms setup is required.');
  const cache = CacheService.getScriptCache();
  const cacheKey = 'native_response_' + name + '_' + submissionId;
  const existingId = cache.get(cacheKey);
  if (existingId) return existingId;
  const form = FormApp.openById(config.id);
  const response = form.createResponse();
  Object.keys(config.items).forEach(key => {
    const values = (params[key] || []).map(String).map(value => value.trim()).filter(Boolean);
    if (!values.length) return;
    const field = config.items[key];
    const item = form.getItemById(field.id);
    let answer;
    if (field.type === 'scale') answer = item.asScaleItem().createResponse(Number(values[0]));
    else if (field.type === 'checkboxes' || field.type === 'consent') answer = item.asCheckboxItem().createResponse(values);
    else if (field.type === 'radio' || field.type === 'select') answer = item.asMultipleChoiceItem().createResponse(values[0]);
    else if (field.type === 'textarea') answer = item.asParagraphTextItem().createResponse(values[0].slice(0, 5000));
    else answer = item.asTextItem().createResponse(values[0].slice(0, 5000));
    response.withItemResponse(answer);
  });
  const id = response.submit().getId();
  cache.put(cacheKey, id, 21600);
  return id;
}
