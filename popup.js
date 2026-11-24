// popup.js – controls in the extension popup

const enforceBtn = document.getElementById("enforceBtn");
const siteEl = document.getElementById("site");
const countEl = document.getElementById("count");
const issuesEl = document.getElementById("issues");
const modeEl = document.getElementById("mode");
const personaEl = document.getElementById("persona");
const clarifyEl = document.getElementById("clarify");
const wordsEl = document.getElementById("words");

// Get the tab the user is looking at
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Update button text and mode
function render(isOn) {
  enforceBtn.textContent = isOn ? "Stop Enforcement" : "Simulate Aura Enforcer";
  enforceBtn.classList.toggle("active", isOn);
  modeEl.textContent = isOn ? "ENFORCING" : "IDLE";
}

// Ask the web page (content.js) how many elements it labelled
async function refreshStatus() {
  const tab = await getActiveTab();
  try {
    siteEl.textContent = new URL(tab.url).hostname || "this page";
  } catch {
    siteEl.textContent = "—";
  }
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "getStatus" });
    countEl.textContent = res.count;
    issuesEl.textContent = res.issues;
    wordsEl.textContent = res.simplified;
  } catch {
    // content.js does not run on chrome:// pages or tabs opened before install
    countEl.textContent = "–";
    issuesEl.textContent = "Not available here (try refreshing the page)";
    wordsEl.textContent = "–";
  }
}

// Popup gets the same theme as the chosen persona
function renderPersona(name) {
  personaEl.value = name;
  document.body.dataset.persona = name;
}

// When the popup opens: show saved state
chrome.storage.local.get({ enforce: false, persona: "none", clarify: false }).then((s) => {
  render(s.enforce);
  renderPersona(s.persona);
  clarifyEl.checked = s.clarify;
  refreshStatus();
});

// Persona changed: save it, every tab follows
personaEl.addEventListener("change", async () => {
  await chrome.storage.local.set({ persona: personaEl.value });
  renderPersona(personaEl.value);
  setTimeout(refreshStatus, 400);
});

// Clarify Content switch: save it, every tab follows
clarifyEl.addEventListener("change", async () => {
  await chrome.storage.local.set({ clarify: clarifyEl.checked });
  setTimeout(refreshStatus, 400);
});

// Button click: switch Enforcer on/off (saved, so all tabs follow)
enforceBtn.addEventListener("click", async () => {
  const { enforce } = await chrome.storage.local.get({ enforce: false });
  const next = !enforce;
  await chrome.storage.local.set({ enforce: next });
  render(next);
  setTimeout(refreshStatus, 300); // give the page time to draw
});