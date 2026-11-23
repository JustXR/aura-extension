// content.js – runs on every web page and draws the Enforcer overlay

(() => {
  // Element types, like the labels in the AURA video
  const TYPES = [
    { name: "STRUCTURE",   tag: "Semantic",       css: "structure",
      sel: "h1,h2,h3,h4,h5,h6,header,nav,main,section,article,footer" },
    { name: "INTERACTION", tag: "Target Boosted", css: "interaction",
      sel: 'a[href],button,input,select,textarea,[role="button"]' },
    { name: "UI ELEMENT",  tag: "Optimized",      css: "ui",
      sel: 'img,svg,video,canvas,[role="img"]' },
    { name: "CONTENT BOX", tag: "Readable",       css: "content",
      sel: "p,li,blockquote,figure,table" },
  ];
  const MAX = 400; // limit so big pages stay fast

  let layer = null;
  let count = 0;
  let issues = 0;
  let enforcing = false;

  // Real accessibility checks (the original only showed fake numbers)
  function findIssue(type, el, rect) {
    if (el.tagName === "IMG" && !el.hasAttribute("alt")) return "Missing alt text";
    if (type.name === "INTERACTION" && (rect.width < 24 || rect.height < 24)) return "Small target";
    return null;
  }

  function isVisible(el, rect) {
    if (rect.width < 4 || rect.height < 4) return false;
    const style = getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  }

  function clear() {
    if (layer) layer.remove();
    layer = null;
    count = 0;
    issues = 0;
  }

  function draw() {
    clear();
    layer = document.createElement("div");
    layer.id = "aura-layer";
    const seen = new Set();

    for (const type of TYPES) {
      for (const el of document.querySelectorAll(type.sel)) {
        if (count >= MAX) break;
        if (seen.has(el)) continue;
        seen.add(el);

        const rect = el.getBoundingClientRect();
        if (!isVisible(el, rect)) continue;

        const issue = findIssue(type, el, rect);
        if (issue) issues++;

        const box = document.createElement("div");
        box.className = `aura-box aura-${type.css}` + (issue ? " aura-issue" : "");
        box.style.top = rect.top + window.scrollY + "px";
        box.style.left = rect.left + window.scrollX + "px";
        box.style.width = rect.width + "px";
        box.style.height = rect.height + "px";

        const label = document.createElement("span");
        label.className = "aura-label";
        label.textContent = type.name;

        const tag = document.createElement("span");
        tag.className = "aura-tag";
        tag.textContent = issue || type.tag;

        box.append(label, tag);
        layer.append(box);
        count++;
      }
    }
    document.documentElement.append(layer);
  }

  function apply(on) {
    enforcing = on;
    if (on) draw();
    else clear();
  }

  // Personas: set an attribute on <html>, content.css does the styling
  let persona = "none";
  function applyPersona(name) {
    persona = name || "none";
    if (persona === "none") delete document.documentElement.dataset.auraPersona;
    else document.documentElement.dataset.auraPersona = persona;
    // text size changes, so the Enforcer boxes must be redrawn
    if (enforcing) setTimeout(draw, 100);
  }

  // Redraw when the window size changes
  let timer;
  window.addEventListener("resize", () => {
    if (!enforcing) return;
    clearTimeout(timer);
    timer = setTimeout(draw, 200);
  });

  // Start with the saved setting, and react when the popup changes it
  chrome.storage.local.get({ enforce: false, persona: "none" }).then((s) => {
    applyPersona(s.persona);
    apply(s.enforce);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.persona) applyPersona(changes.persona.newValue);
    if (changes.enforce) apply(changes.enforce.newValue);
  });

  // Answer the popup's question "how many did you label?"
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "getStatus") sendResponse({ count, issues, enforcing, persona });
  });
})();