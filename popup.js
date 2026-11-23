// popup.js – controls in the extension popup

const enforceBtn = document.getElementById("enforceBtn");
const siteEl = document.getElementById("site");
const countEl = document.getElementById("count");
const issuesEl = document.getElementById("issues");
const modeEl = document.getElementById("mode");

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
  } catch {
    // content.js does not run on chrome:// pages or tabs opened before install
    countEl.textContent = "–";
    issuesEl.textContent = "Not available here (try refreshing the page)";
  }
}

// When the popup opens: show saved state
chrome.storage.local.get({ enforce: false }).then(({ enforce }) => {
  render(enforce);
  refreshStatus();
});

// Button click: switch Enforcer on/off (saved, so all tabs follow)
enforceBtn.addEventListener("click", async () => {
  const { enforce } = await chrome.storage.local.get({ enforce: false });
  const next = !enforce;
  await chrome.storage.local.set({ enforce: next });
  render(next);
  setTimeout(refreshStatus, 300); // give the page time to draw
});