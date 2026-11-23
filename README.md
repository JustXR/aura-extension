# Aura Extension – Reverse Engineering Project

APL project 2026 

## Project purpose
Reverse engineer the AURA application (shown in a demo video) and rebuild
its core functionality as a Chrome browser extension.

## Phase 1: Research

### Analysing the original application
From the demo video, AURA is presented as a Windows app with local AI that
fixes accessibility problems on screen. The demo itself is a single static
web page (HTML/CSS/JS) opened locally, with:
- A persona selector: "The Voyager (Color Blind)" and "The Beacon (Low Vision)"
- A "Simulate Aura Enforcer" button that outlines and labels every element
  (STRUCTURE, INTERACTION, UI ELEMENT, CONTENT BOX)
- A "Clarify Content" toggle that rewrites text in simpler language
  and switches to a more readable font
- A status card (Scanning / Fixes Applied / Mode) with hard-coded values

### Guessed inputs
- Selected persona
- Enforcer on/off
- Clarify Content on/off

### Guessed process
1. Enforcer: loop through page elements, classify by type, add outline + label
2. Persona: add a CSS class to the page that changes colors/contrast
3. Clarify: swap text for simpler versions and change font/spacing

### Scope decision
A full Windows app with local AI is not realistic in 3.5 days. After
discussing with my supervisor, I rebuild the same idea as a Chrome
extension that works on any website.

| AURA (original)          | My extension                         |
|--------------------------|--------------------------------------|
| Top bar controls         | Popup with the same 3 controls       |
| Simulate Enforcer        | Content script labelling elements    |
| Beacon (Low Vision)      | High-contrast theme, larger text     |
| Voyager (Color Blind)    | Color-blind-friendly colors          |
| Clarify Content          | Readable font + spacing              |
| Fake status numbers      | Real site name + real fix count      |

### Tools
- Chrome Extension (Manifest V3), HTML, CSS, JavaScript
- VS Code, Git, GitHub Desktop
- GenAI: Claude

### Problems and solutions
- **Problem:** The task suggests Lovable/V0, but they build websites,
  not browser extensions.
  **Solution:** Used Claude instead, which can generate extension code.
- **Problem:** The original is a desktop app with local AI – too big for the time.
  **Solution:** Reduced scope to a browser extension with similar features.

## Phase 2: Implementation

### Setup
- Created the GitHub repo and cloned it with GitHub Desktop
- Created the extension structure: manifest.json, popup.html, popup.js,
  content.js, content.css
- Loaded the extension in Chrome via Developer mode → Load unpacked

### Problems and solutions
- **Problem:** The popup showed "Coming soonâ€¦" instead of "Coming soon…".
  **Solution:** Added `<meta charset="UTF-8">` so Chrome reads the file
  with the right encoding.

## Phase 3: Completion
_Coming soon_

## Phase 4: Problems & Solutions
_Coming soon_

## Conclusion
_Coming soon_
