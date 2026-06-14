# EventMath Summarizer — Claude Code Instructions

You are building a desktop file summarizer in EventMath (`.em` language).
The EventMath compiler, runtime, and all examples are at `C:\Users\ryan\Desktop\eventmath2026\`.

## What Summarizer Does

1. Scans `C:\Users\ryan\OneDrive\Desktop` for all files
2. Groups similar files based on:
   - File extension
   - Name prefixes (e.g. "Screenshot", "IMG_", "receipt", "invoice")
   - File size ranges
   - Last modified date proximity
3. Serves a web UI at `http://localhost:3002` with:
   - Tree/groups view (like WinDirStat but group-based)
   - Each file shows name, size, modified date, extension
   - Delete button on each individual file
   - Delete group button (deletes all files in that group)
   - Confirmation dialog before deletion
   - Total size per group
   - Overall stats (total files, total size)

## Tech Stack
- **Language:** EventMath (`.em` files compiled to JS via the compiler)
- **HTTP Server:** EventMath `serve` verb
- **UI:** HTML served inline with vanilla JavaScript for interactivity
- **File scanning:** Use `spawn` from EventMath's Machine Layer (v2.28) to run a Node.js scanner script, OR use a companion Node.js HTTP helper
- **Runtime:** EventMath runtime <10KB, zero npm deps

## Project Files to Create
- `summarizer.em` — Main EventMath program with `serve` routes
- `scanner.js` — Node.js helper for filesystem operations (called by EventMath)
- `summarizer.bat` — Launch script
- `README.md` — Usage instructions

## EventMath Syntax Reference
Key constructs:
- `serve port N ... end` — HTTP server
- `route get|post "/path" ... reply ... end` — Route handlers
- `rain NAME is VALUE` — Mutable variable
- `star NAME is VALUE` — Constant
- `spawn COMMAND into VAR` — Run process (Machine Layer v2.28)
- `earth get|post URL into VAR` — HTTP client
- `lens NAME is EXPR` — Safe computed value
- `event NAME ... end` — Event definition
- `matter ... end` — Event properties
- `action NAME ... door ... end` — Action/door pattern

## Filesystem Operations
For file scanning, create `scanner.js` that:
- Uses `fs.readdirSync` / `fs.statSync` to scan the desktop
- Groups files by: extension, name prefix (regex), size buckets, date proximity
- Returns JSON via stdout when called

The EventMath program will `spawn` this scanner to get file data.