# Summarizer — EventMath Desktop File Organizer

Scans your desktop, groups similar files by context (name, type, size, date), 
and presents a web UI with delete buttons for individual files or whole groups.

## How to Use

1. **Compile the EventMath program:**
   ```
   cd /e/eventmath2026
   node bin/em compile /e/summarizer/summarizer.em -o /e/summarizer/summarizer.js
   ```

2. **Launch:**
   ```
   node /e/summarizer/start.js
   ```

3. **Open in browser:**
   ```
   http://localhost:3002
   ```

## Architecture

- `summarizer.em` — EventMath source (defines serve routes, spawns scanner)
- `scanner.js` — Node.js filesystem scanner (reads desktop, groups files)
- `index.html` — Web UI with tree view + delete buttons
- `start.js` — Launcher that runs everything together
- `serve-static.js` — Static file server for the HTML UI

## Requirements
- Node.js 18+
- EventMath compiler (at /e/eventmath2026)
- Windows (scans C:\Users\ryan\OneDrive\Desktop)