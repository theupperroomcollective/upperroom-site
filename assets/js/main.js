/* The Upper Room Collective - site behaviour
   1. Settings  2. Menu  3. Header  4. Reveal  5. Run Club dates and Luma links
   6. Masterclass topic preselection  7. Forms (multi-step, limits, conditional fields, delivery) */
(function () {
  "use strict";

  /* 1. SETTINGS - the only lines that need editing ------------------------------- */
  var CONFIG = {
    // Paste the Google Apps Script web app URL here once Tanya has deployed it
    // (see apps-script/SETUP.txt). While empty, forms are delivered by FormSubmit.
    sheetEndpoint: "",
    contactEmail: "tanya@the5collective.org",
    // Founder Run Club: paste each Saturday's Luma link (YYYY-MM-DD keys) or one general link.
    luma: {
      general: "",
      "2026-11-14": "", "2026-11-21": "", "2026-11-28": "",
      "2026-12-05": "", "2026-12-12": "", "2026-12-19": ""
    }
  };
  var FORMSUBMIT = "https://formsubmit.co/ajax/" + CONFIG.contactEmail;

  document.documentElement.classList.add("js");

  /* 2. Menu ------------------------------------------------------------------- */
  var toggle = document.querySelector(".menu-toggle");
  var panel = document.getElementById("menu-panel");
  var lastFocus = null;
  function focusables() { return panel ? Array.prototype.slice.call(panel.querySelectorAll("a[href], button:not([disabled])")) : []; }
  function openMenu() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add("open"); });
    document.body.classList.add("menu-open");
    toggle.setAttribute("aria-expanded", "true");
    var f = focusables(); if (f.length) setTimeout(function () { f[0].focus(); }, 60);
  }
  function closeMenu(restore) {
    if (!panel || panel.hidden) return;
    panel.classList.remove("open");
    document.body.classList.remove("menu-open");
    toggle.setAttribute("aria-expanded", "false");
    setTimeout(function () { panel.hidden = true; }, 300);
    if (restore !== false && lastFocus) lastFocus.focus();
  }
  if (toggle && panel) {
    toggle.addEventListener("click", openMenu);
    panel.querySelectorAll("[data-close-menu]").forEach(function (b) { b.addEventListener("click", function () { closeMenu(); }); });
    panel.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", function () { closeMenu(false); }); });
    document.addEventListener("keydown", function (e) {
      if (panel.hidden) return;
      if (e.key === "Escape") { closeMenu(); return; }
      if (e.key === "Tab") {
        var f = focusables(); if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    window.addEventListener("resize", function () { if (window.innerWidth >= 1080) closeMenu(false); });
  }

  /* 3. Header ------------------------------------------------------------------ */
  var header = document.querySelector(".site-header");
  function onScroll() { if (header) header.classList.toggle("scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* 4. Reveal (only below the first screen) --------------------------------------- */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.classList.add("reveal"); io.observe(el);
    });
  }
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* 5. Run Club: accurate date status and registration links ------------------------ */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var nextFound = false;
  document.querySelectorAll("[data-run-date]").forEach(function (row) {
    var iso = row.getAttribute("data-run-date");
    var d = new Date(iso + "T12:00:00");
    var state = row.querySelector(".state");
    var deadline = new Date(d); deadline.setDate(d.getDate() - 3); deadline.setHours(23, 59, 0, 0);
    var link = CONFIG.luma[iso] || CONFIG.luma.general;
    if (d < today) {
      row.classList.add("is-past");
      if (state) state.innerHTML = '<span class="chip soft">Completed</span>';
      return;
    }
    if (!nextFound) { row.classList.add("is-next"); nextFound = true; }
    if (!state) return;
    if (new Date() > deadline) { state.innerHTML = '<span class="chip soft">Registration closed</span>'; return; }
    if (link) {
      state.innerHTML = '<a class="btn" href="' + link + '" target="_blank" rel="noopener">Save your spot</a>';
    } else {
      state.innerHTML = '<span class="chip soft">' + (row.classList.contains("is-next") ? "Next run" : "Upcoming") + "</span>";
    }
  });
  document.querySelectorAll("[data-luma]").forEach(function (btn) {
    var link = CONFIG.luma.general;
    if (!link) {
      // find the next date with a link
      document.querySelectorAll("[data-run-date]").forEach(function (row) {
        var iso = row.getAttribute("data-run-date");
        if (!link && !row.classList.contains("is-past") && CONFIG.luma[iso]) link = CONFIG.luma[iso];
      });
    }
    var note = btn.parentNode.querySelector(".luma-note");
    if (link) { btn.href = link; btn.target = "_blank"; btn.rel = "noopener"; btn.removeAttribute("aria-disabled"); if (note) note.hidden = true; }
    else {
      btn.removeAttribute("href"); btn.setAttribute("aria-disabled", "true"); btn.setAttribute("role", "link");
      if (note) note.hidden = false;
    }
  });

  /* 6. Masterclass topic preselection ------------------------------------------------ */
  function preselect(topic, source) {
    var form = document.getElementById("f-masterclass"); if (!form) return;
    form.querySelectorAll('input[name="Masterclass interests"]').forEach(function (cb) { if (cb.value === topic) cb.checked = true; });
    var src = form.querySelector('input[name="Waitlist source"]'); if (src) src.value = source || topic;
  }
  document.querySelectorAll("[data-preselect]").forEach(function (a) {
    a.addEventListener("click", function () { preselect(a.getAttribute("data-preselect"), a.getAttribute("data-source")); });
  });
  var params = new URLSearchParams(window.location.search);
  if (params.get("class")) preselect(params.get("class"), "Link: " + params.get("class"));

  /* 7. Forms ------------------------------------------------------------------------ */
  function visible(el) { return !el.closest("[hidden]"); }
  function fieldError(input) {
    var v = input.validity;
    if (v.valid) return "";
    if (v.valueMissing) return input.type === "email" ? "Please enter your email address." : (input.tagName === "SELECT" ? "Please choose an option." : "Please fill in this field.");
    if (v.typeMismatch) return input.type === "url" ? "Please enter a full web address, for example https://linkedin.com/in/yourname." : "Please enter a valid email address, for example name@company.com.";
    if (v.tooShort) return "Please add a little more detail.";
    return input.validationMessage || "Please check this field.";
  }
  function setError(input, msg) {
    var holder = document.getElementById(input.getAttribute("data-err"));
    if (msg) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    if (holder) holder.textContent = msg;
  }
  function validate(scope) {
    var first = null;
    scope.querySelectorAll("[data-err]").forEach(function (input) {
      if (!visible(input) || input.disabled) { setError(input, ""); return; }
      var msg = fieldError(input); setError(input, msg); if (msg && !first) first = input;
    });
    scope.querySelectorAll("[data-required-group]").forEach(function (fs) {
      if (!visible(fs)) return;
      var ok = fs.querySelectorAll("input:checked").length > 0;
      var holder = document.getElementById(fs.getAttribute("data-required-group"));
      if (holder) holder.textContent = ok ? "" : "Please choose at least one option.";
      if (!ok && !first) first = fs.querySelector("input");
    });
    return first;
  }

  // Selection limits ("choose up to N")
  document.querySelectorAll("[data-max]").forEach(function (fs) {
    var max = parseInt(fs.getAttribute("data-max"), 10);
    function update() {
      var boxes = fs.querySelectorAll('input[type="checkbox"]');
      var n = fs.querySelectorAll("input:checked").length;
      boxes.forEach(function (b) { b.disabled = !b.checked && n >= max; });
      var holder = document.getElementById(fs.getAttribute("data-required-group"));
      if (holder && n) holder.textContent = "";
    }
    fs.addEventListener("change", update); update();
  });
  document.querySelectorAll("[data-required-group]:not([data-max])").forEach(function (fs) {
    fs.addEventListener("change", function () {
      var holder = document.getElementById(fs.getAttribute("data-required-group"));
      if (holder && fs.querySelectorAll("input:checked").length) holder.textContent = "";
    });
  });

  // Conditional fields: data-show-when="selectId=Value one|Value two"
  document.querySelectorAll("[data-show-when]").forEach(function (box) {
    var spec = box.getAttribute("data-show-when").split("=");
    var ctrl = document.getElementById(spec[0]); var values = spec[1].split("|");
    function sync() {
      var show = values.indexOf(ctrl.value) !== -1;
      box.hidden = !show;
      box.querySelectorAll("input, select, textarea").forEach(function (i) { i.disabled = !show; });
    }
    ctrl.addEventListener("change", sync); sync();
  });

  // Multi-step forms
  document.querySelectorAll("form[data-steps]").forEach(function (form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
    var label = form.querySelector(".progress .label"); var bar = form.querySelector(".progress .bar i");
    var idx = 0;
    function show(i) {
      steps.forEach(function (s, n) { s.hidden = n !== i; });
      idx = i;
      if (label) label.textContent = "Step " + (i + 1) + " of " + steps.length;
      if (bar) bar.style.width = ((i + 1) / steps.length * 100) + "%";
      form.querySelectorAll("[data-nav-back]").forEach(function (b) { b.hidden = i === 0; });
      form.querySelectorAll("[data-nav-next]").forEach(function (b) { b.hidden = i === steps.length - 1; });
      form.querySelectorAll('button[type="submit"]').forEach(function (b) { b.hidden = i !== steps.length - 1; });
    }
    form.querySelectorAll("[data-nav-next]").forEach(function (b) {
      b.addEventListener("click", function () {
        var bad = validate(steps[idx]);
        if (bad) { bad.focus(); return; }
        show(idx + 1);
        var top = form.getBoundingClientRect().top + window.scrollY - 100; window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
        var f = steps[idx].querySelector("input, select, textarea"); if (f) f.focus({ preventScroll: true });
      });
    });
    form.querySelectorAll("[data-nav-back]").forEach(function (b) { b.addEventListener("click", function () { show(idx - 1); }); });
    show(0);
  });

  function collect(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) {
      if (key === "_honey" || String(value).trim() === "") return;
      data[key] = data[key] ? data[key] + ", " + value : value;
    });
    return data;
  }
  function mailtoFor(data) {
    var lines = [];
    Object.keys(data).forEach(function (k) { if (k.charAt(0) !== "_") lines.push(k + ": " + data[k]); });
    return "mailto:" + CONFIG.contactEmail + "?subject=" + encodeURIComponent(data._subject || "Website enquiry") + "&body=" + encodeURIComponent(lines.join("\n"));
  }
  function firstName(data) { var n = data["First name"] || data["Full name"] || data.Name || ""; return n.split(" ")[0] || "friend"; }
  function showSuccess(form, data) {
    var box = document.createElement("div");
    box.className = "form-success"; box.setAttribute("tabindex", "-1"); box.setAttribute("role", "status");
    box.innerHTML = '<div class="seal" aria-hidden="true"><svg width="22" height="16" viewBox="0 0 22 16"><path d="M1 8.5l6.5 6L21 1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></div><h3></h3><p></p>';
    box.querySelector("h3").textContent = form.getAttribute("data-success-title") || "Thank you.";
    box.querySelector("p").textContent = (form.getAttribute("data-success-text") || "").replace("{name}", firstName(data || {}));
    var wrap = form.closest("[data-form-wrap]") || form;
    wrap.replaceWith(box);
    box.focus({ preventScroll: true });
  }
  function showFailure(status, data) {
    status.className = "form-status error"; status.innerHTML = "";
    status.appendChild(document.createTextNode("We could not send this just now. Please try again, or "));
    var a = document.createElement("a"); a.href = mailtoFor(data); a.textContent = "send it from your email app";
    status.appendChild(a); status.appendChild(document.createTextNode(" to " + CONFIG.contactEmail + "."));
  }

  function deliver(form, data) {
    var payload = {};
    Object.keys(data).forEach(function (k) { payload[k] = data[k]; });
    payload["Form"] = form.getAttribute("data-subject");
    payload["Source tag"] = form.getAttribute("data-source") || "";
    payload["Submitted from"] = window.location.origin + window.location.pathname;
    payload["Submitted at"] = new Date().toISOString();
    if (CONFIG.sheetEndpoint) {
      payload._confirmation = form.getAttribute("data-autoresponse") || "";
      return fetch(CONFIG.sheetEndpoint, { method: "POST", body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || "Database error"); return j; });
    }
    payload._subject = form.getAttribute("data-subject");
    payload._template = "table";
    payload._captcha = "false";
    if (data.Email) { payload._replyto = data.Email; payload.email = data.Email; }
    var auto = form.getAttribute("data-autoresponse");
    if (auto && data.Email) payload._autoresponse = auto;
    return fetch(FORMSUBMIT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (r) { if (!(r.ok && (r.j.success === true || r.j.success === "true"))) throw new Error(r.j.message || "Form service error"); return r.j; });
  }

  document.querySelectorAll("form[data-form]").forEach(function (form) {
    form.setAttribute("novalidate", "");
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var label = button ? button.innerHTML : "";
    var sending = false;
    form.querySelectorAll("[data-err]").forEach(function (input) {
      input.addEventListener("blur", function () { if (input.value) setError(input, fieldError(input)); });
      input.addEventListener("input", function () { if (input.getAttribute("aria-invalid")) setError(input, fieldError(input)); });
      input.addEventListener("change", function () { if (input.getAttribute("aria-invalid")) setError(input, fieldError(input)); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      if (status) { status.textContent = ""; status.className = "form-status"; }
      var hp = form.querySelector('[name="_honey"]');
      if (hp && hp.value) { showSuccess(form, {}); return; }
      var bad = validate(form);
      if (bad) {
        var step = bad.closest(".step");
        if (step && step.hidden) { /* jump back to the step that needs attention */
          form.querySelectorAll(".step").forEach(function (s) { s.hidden = s !== step; });
        }
        bad.focus();
        if (status) { status.className = "form-status error"; status.textContent = "Please check the highlighted fields."; }
        return;
      }
      var data = collect(form);
      sending = true;
      if (button) { button.disabled = true; button.setAttribute("aria-busy", "true"); if (button.textContent.trim()) button.innerHTML = "Sending..."; }
      var timer, done = false;
      var timeout = new Promise(function (_, rej) { timer = setTimeout(function () { rej(new Error("timeout")); }, 20000); });
      Promise.race([deliver(form, data), timeout]).then(function () {
        done = true; clearTimeout(timer); showSuccess(form, data);
      }).catch(function () {
        clearTimeout(timer); sending = false;
        if (button) { button.disabled = false; button.removeAttribute("aria-busy"); button.innerHTML = label; }
        if (status) showFailure(status, data);
      });
    });
  });
})();
