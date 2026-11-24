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
    if (type.name === "INTERACTION" && (rect.width < 24 || rect.height < 24)) {
      // Links inside a sentence are allowed to be small (WCAG 2.2, target size exception)
      if (el.tagName === "A" && getComputedStyle(el).display === "inline") return null;
      return "Small target";
    }
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

  // ---------- Clarify Content ----------
  // Difficult words -> simpler words (like the text swap in the AURA video)
  const SIMPLE_WORDS = {
    "approximately": "about", "utilize": "use", "utilise": "use",
    "assistance": "help", "commence": "start", "terminate": "end",
    "purchase": "buy", "numerous": "many", "sufficient": "enough",
    "additional": "extra", "demonstrate": "show", "facilitate": "help",
    "obtain": "get", "require": "need", "requires": "needs",
    "required": "needed", "regarding": "about", "subsequently": "later",
    "prior to": "before", "in order to": "to", "individuals": "people",
    "initiate": "start", "modify": "change", "participate": "take part",
    "consequently": "so", "nevertheless": "still", "therefore": "so",
    "frequently": "often", "previously": "before", "currently": "now",
    "accomplish": "do", "establish": "set up", "inquire": "ask",
    "endeavour": "try", "endeavor": "try", "sufficiently": "enough",
  };
  const WORD_RE = new RegExp(
    "\\b(" +
      Object.keys(SIMPLE_WORDS)
        .sort((a, b) => b.length - a.length) // longest phrases first
        .map((w) => w.replace(/ /g, "\\s+"))
        .join("|") +
      ")\\b",
    "gi"
  );

  const originals = new Map(); // text node -> original text, to undo later
  let simplified = 0;
  let clarifying = false;

  // Keep a capital letter if the original word had one
  function matchCase(word, replacement) {
    return word[0] === word[0].toUpperCase()
      ? replacement[0].toUpperCase() + replacement.slice(1)
      : replacement;
  }

  function simplifyText() {
    const skip = 'script,style,noscript,textarea,input,code,pre,[contenteditable="true"]';
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || parent.closest(skip)) return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      const text = node.nodeValue;
      let changes = 0;
      const newText = text.replace(WORD_RE, (match) => {
        changes++;
        const key = match.toLowerCase().replace(/\s+/g, " ");
        return matchCase(match, SIMPLE_WORDS[key]);
      });
      if (changes) {
        originals.set(node, text);
        node.nodeValue = newText;
        simplified += changes;
      }
    }
  }

  function restoreText() {
    for (const [node, text] of originals) node.nodeValue = text;
    originals.clear();
    simplified = 0;
  }

  function applyClarify(on) {
    if (on === clarifying) return;
    clarifying = on;
    if (on) {
      document.documentElement.dataset.auraClarify = "on"; // content.css changes the font
      simplifyText();
    } else {
      delete document.documentElement.dataset.auraClarify;
      restoreText();
    }
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
  chrome.storage.local.get({ enforce: false, persona: "none", clarify: false }).then((s) => {
    applyPersona(s.persona);
    applyClarify(s.clarify);
    apply(s.enforce);
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    if (changes.persona) applyPersona(changes.persona.newValue);
    if (changes.clarify) applyClarify(changes.clarify.newValue);
    if (changes.enforce) apply(changes.enforce.newValue);
  });

  // Answer the popup's question "how many did you label?"
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "getStatus") sendResponse({ count, issues, enforcing, persona, simplified });
  });
})();