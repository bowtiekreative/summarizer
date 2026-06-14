#!/usr/bin/env node
/**
 * Summarizer Scanner v1.0
 * Scans the user's desktop, groups files by similarity,
 * outputs JSON for the EventMath web UI.
 */
const fs = require('fs');
const path = require('path');

const DESKTOP = "C:\\Users\\ryan\\OneDrive\\Desktop";

// ── File grouping logic ─────────────────────────────────

function getGroupKey(name, ext, size, mtime) {
  // Priority 1: Name prefix patterns
  const nameMatch = name.match(/^([A-Za-z]+[\s\-_]*)/);
  const prefix = nameMatch ? nameMatch[1].trim().toLowerCase() : '';
  const knownPrefixes = [
    'screenshot', 'img_', 'photo', 'image', 'pic',
    'receipt', 'invoice', 'bill', 'payment',
    'doc', 'document', 'report', 'summary',
    'video', 'movie', 'clip', 'recording',
    'music', 'song', 'audio', 'podcast',
    'backup', 'archive', 'export', 'dump',
    'temp', 'tmp', 'delete', 'old',
    'download', 'installer', 'setup', 'update',
    'note', 'todo', 'list', 'plan',
    'letter', 'memo', 'email', 'message',
    'contract', 'agreement', 'proposal', 'quote',
    'invoice', 'order', 'purchase', 'receipt',
    'budget', 'finance', 'tax', 'account',
    'config', 'settings', 'preferences',
    'code', 'script', 'source', 'project',
  ];
  for (const p of knownPrefixes) {
    if (prefix.startsWith(p)) return capitalize(p);
  }

  // Priority 2: Extension-based
  const extMap = {
    '.jpg': 'Images', '.jpeg': 'Images', '.png': 'Images', '.gif': 'Images',
    '.webp': 'Images', '.svg': 'Images', '.bmp': 'Images', '.tiff': 'Images',
    '.mp4': 'Videos', '.mov': 'Videos', '.avi': 'Videos', '.mkv': 'Videos',
    '.webm': 'Videos', '.wmv': 'Videos',
    '.mp3': 'Audio', '.wav': 'Audio', '.flac': 'Audio', '.aac': 'Audio',
    '.ogg': 'Audio', '.wma': 'Audio', '.m4a': 'Audio',
    '.pdf': 'PDFs & Docs', '.doc': 'PDFs & Docs', '.docx': 'PDFs & Docs',
    '.xls': 'Spreadsheets', '.xlsx': 'Spreadsheets', '.csv': 'Spreadsheets',
    '.ppt': 'Presentations', '.pptx': 'Presentations',
    '.zip': 'Archives', '.rar': 'Archives', '.7z': 'Archives', '.tar': 'Archives',
    '.gz': 'Archives', '.bz2': 'Archives',
    '.exe': 'Executables', '.msi': 'Executables', '.appx': 'Executables',
    '.txt': 'Text Files', '.rtf': 'Text Files', '.md': 'Text Files',
    '.html': 'Web Files', '.htm': 'Web Files', '.css': 'Web Files', '.js': 'Web Files',
    '.json': 'Data Files', '.xml': 'Data Files', '.yaml': 'Data Files', '.yml': 'Data Files',
    '.py': 'Code', '.js': 'Code', '.ts': 'Code', '.java': 'Code', '.cpp': 'Code',
    '.c': 'Code', '.h': 'Code', '.rb': 'Code', '.go': 'Code', '.rs': 'Code',
    '.dll': 'System Files', '.sys': 'System Files', '.ini': 'System Files',
    '.lnk': 'Shortcuts', '.url': 'Shortcuts',
  };
  if (extMap[ext]) return extMap[ext];

  // Priority 3: Size buckets
  if (size < 1024) return 'Tiny Files (<1KB)';
  if (size < 10240) return 'Small Files (1-10KB)';
  if (size < 102400) return 'Medium Files (10-100KB)';
  if (size < 1048576) return 'Large Files (100KB-1MB)';
  if (size < 10485760) return 'Big Files (1-10MB)';
  return 'Huge Files (>10MB)';
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Scanner ──────────────────────────────────────────────

function scan() {
  const groups = {};

  try {
    const files = fs.readdirSync(DESKTOP);
    for (const file of files) {
      const fullPath = path.join(DESKTOP, file);
      try {
        const stat = fs.statSync(fullPath);
        if (!stat.isFile()) continue;

        const ext = path.extname(file).toLowerCase();
        const groupKey = getGroupKey(file, ext, stat.size, stat.mtimeMs);

        if (!groups[groupKey]) {
          groups[groupKey] = { name: groupKey, files: [], totalSize: 0, count: 0 };
        }

        groups[groupKey].files.push({
          name: file,
          path: fullPath,
          size: stat.size,
          sizeFormatted: formatSize(stat.size),
          ext: ext || '(none)',
          mtime: stat.mtime.toISOString().split('T')[0],
          mtimeFull: stat.mtime.toISOString()
        });
        groups[groupKey].totalSize += stat.size;
        groups[groupKey].count++;
      } catch (e) {
        // Skip files we can't stat
      }
    }
  } catch (e) {
    console.error(`Cannot read desktop: ${e.message}`);
  }

  // Sort groups by size descending, sort files within by mtime
  const sorted = Object.values(groups)
    .sort((a, b) => b.totalSize - a.totalSize);

  for (const g of sorted) {
    g.totalSizeFormatted = formatSize(g.totalSize);
    g.files.sort((a, b) => b.mtime.localeCompare(a.mtime));
  }

  const totalFiles = sorted.reduce((s, g) => s + g.count, 0);
  const totalSize = sorted.reduce((s, g) => s + g.totalSize, 0);

  return {
    groups: sorted,
    stats: {
      totalFiles,
      totalSize,
      totalSizeFormatted: formatSize(totalSize),
      groupCount: sorted.length
    }
  };
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

// ── Main ─────────────────────────────────────────────────

const result = scan();
process.stdout.write(JSON.stringify(result, null, 2));