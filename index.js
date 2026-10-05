// Brew Haven — page behaviour

// Invoker commands (commandfor/command) power the mobile menu; polyfill only where missing.
if (!("commandForElement" in HTMLButtonElement.prototype)) {
  import("https://esm.run/invokers-polyfill").catch(() => {
    // Last-resort fallback: open/close the dialog manually.
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button[commandfor]");
      if (!button) return;
      const target = document.getElementById(button.getAttribute("commandfor"));
      const command = button.getAttribute("command");
      if (command === "show-modal") target?.showModal();
      if (command === "close") target?.close();
    });
  });
}

// Header: solid background once the page is scrolled ------------------------
const header = document.getElementById("siteHeader");
const sentinel = document.createElement("div");
sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none";
document.body.prepend(sentinel);

new IntersectionObserver(([entry]) => {
  header.classList.toggle("is-scrolled", !entry.isIntersecting);
}).observe(sentinel);

// Highlight the nav link for the section in view ---------------------------
const navLinks = [...document.querySelectorAll(".primary-nav a")];
const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const id = entry.target.id;
      for (const link of navLinks) {
        if (id && link.getAttribute("href") === `#${id}`) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    }
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
for (const section of document.querySelectorAll("main section")) {
  sectionObserver.observe(section);
}

// Mobile menu ----------------------------------------------------------------
const mobileNav = document.getElementById("mobileNav");
const navToggle = document.querySelector(".nav-toggle");

new MutationObserver(() => {
  navToggle.setAttribute("aria-expanded", String(mobileNav.open));
}).observe(mobileNav, { attributes: true, attributeFilter: ["open"] });

mobileNav.addEventListener("click", (event) => {
  if (event.target.closest("a")) mobileNav.close();
});

window.matchMedia("(min-width: 880px)").addEventListener("change", (event) => {
  if (event.matches && mobileNav.open) mobileNav.close();
});

// Menu filter tabs -------------------------------------------------------------
const tabs = [...document.querySelectorAll(".menu-tabs [role='tab']")];
const menuItems = [...document.querySelectorAll(".menu-item")];

function selectTab(tab, { focus = false } = {}) {
  for (const t of tabs) {
    const selected = t === tab;
    t.setAttribute("aria-selected", String(selected));
    t.tabIndex = selected ? 0 : -1;
  }
  if (focus) tab.focus();

  const filter = tab.dataset.filter;
  let i = 0;
  for (const item of menuItems) {
    const show = filter === "all" || item.dataset.category === filter;
    item.hidden = !show;
    item.classList.remove("is-entering");
    if (show) {
      item.style.setProperty("--i", i++);
      void item.offsetWidth; // restart the entry animation
      item.classList.add("is-entering");
    }
  }
}

for (const tab of tabs) {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(tab);
    const next = {
      ArrowRight: tabs[(index + 1) % tabs.length],
      ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
      Home: tabs[0],
      End: tabs[tabs.length - 1],
    }[event.key];
    if (!next) return;
    event.preventDefault();
    selectTab(next, { focus: true });
  });
}

// Opening hours & live status (shop time: America/Los_Angeles) ---------------
const HOURS = {
  0: [8, 18], // Sunday
  1: [7, 20],
  2: [7, 20],
  3: [7, 20],
  4: [7, 20],
  5: [7, 20],
  6: [8, 18], // Saturday
};
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shopNow() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    day: WEEKDAYS.indexOf(get("weekday")),
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

const formatHour = (h) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

function openStatus() {
  const { day, minutes } = shopNow();
  const [open, close] = HOURS[day];

  if (minutes >= open * 60 && minutes < close * 60) {
    const closingSoon = close * 60 - minutes <= 60;
    return {
      state: "open",
      text: closingSoon
        ? `Open now · closing soon (${formatHour(close)})`
        : `Open now · closes ${formatHour(close)}`,
    };
  }
  if (minutes < open * 60) {
    return { state: "closed", text: `Closed · opens today at ${formatHour(open)}` };
  }
  const tomorrow = (day + 1) % 7;
  return { state: "closed", text: `Closed · opens tomorrow at ${formatHour(HOURS[tomorrow][0])}` };
}

function renderHours() {
  const { state, text } = openStatus();
  for (const el of document.querySelectorAll("[data-open-status]")) {
    el.textContent = text;
    el.dataset.state = state;
  }

  const today = shopNow().day;
  for (const row of document.querySelectorAll(".hours tr")) {
    const isToday = Number(row.dataset.day) === today;
    row.classList.toggle("is-today", isToday);
    row.querySelector(".today-tag")?.remove();
    if (isToday) {
      const tag = document.createElement("span");
      tag.className = "today-tag";
      tag.textContent = "Today";
      row.querySelector("th").append(tag);
    }
  }
}

renderHours();
setInterval(renderHours, 60_000);

// Form helpers -------------------------------------------------------------------
function syncAriaInvalid(form) {
  for (const field of form.querySelectorAll("input, textarea")) {
    field.setAttribute("aria-invalid", String(!field.checkValidity()));
  }
}

document.addEventListener(
  "blur",
  (event) => {
    const field = event.target;
    if (!(field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)) return;
    if (field.matches(":user-invalid") || field.closest(".was-submitted")) {
      field.setAttribute("aria-invalid", String(!field.checkValidity()));
    }
  },
  true
);

document.addEventListener("input", (event) => {
  const field = event.target;
  if (field.hasAttribute?.("aria-invalid")) {
    field.setAttribute("aria-invalid", String(!field.checkValidity()));
  }
});

// Contact form -------------------------------------------------------------------
const contactForm = document.getElementById("contactForm");
const contactSuccess = document.getElementById("contactSuccess");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  contactForm.classList.add("was-submitted");
  syncAriaInvalid(contactForm);

  if (!contactForm.checkValidity()) {
    contactForm.querySelector(":invalid")?.focus();
    return;
  }

  // No backend yet — show a friendly confirmation instead.
  const name = contactForm.elements.name.value.trim().split(/\s+/)[0];
  contactSuccess.querySelector("[data-success-text]").textContent =
    `Thanks, ${name}! We’ve got your message and we’ll be in touch soon.`;
  contactForm.hidden = true;
  contactSuccess.hidden = false;
  contactSuccess.focus();
});

document.getElementById("contactAgain").addEventListener("click", () => {
  contactForm.reset();
  contactForm.classList.remove("was-submitted");
  for (const field of contactForm.querySelectorAll("[aria-invalid]")) field.removeAttribute("aria-invalid");
  contactSuccess.hidden = true;
  contactForm.hidden = false;
  contactForm.elements.name.focus();
});

// Newsletter --------------------------------------------------------------------
const newsletterForm = document.getElementById("newsletterForm");
const newsletterMsg = document.getElementById("newsletterMsg");

newsletterForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = newsletterForm.elements.email;

  if (!input.checkValidity()) {
    newsletterForm.classList.add("was-submitted");
    input.setAttribute("aria-invalid", "true");
    newsletterMsg.className = "news-msg is-error";
    newsletterMsg.textContent = "Please enter a valid email address.";
    input.focus();
    return;
  }

  newsletterForm.reset();
  newsletterForm.classList.remove("was-submitted");
  input.removeAttribute("aria-invalid");
  newsletterMsg.className = "news-msg is-success";
  newsletterMsg.textContent = "You’re on the list — thanks for subscribing!";
});

// Footer year ---------------------------------------------------------------------
document.getElementById("year").textContent = new Date().getFullYear();

// 3D scene safety net: show the illustrated cup if WebGL never comes up ----------
const heroVisual = document.getElementById("heroVisual");
setTimeout(() => {
  if (heroVisual.dataset.scene === "loading") heroVisual.dataset.scene = "failed";
}, 8000);
