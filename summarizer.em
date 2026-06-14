# Summarizer — EventMath Desktop File Organizer
# API server: scans C:\Users\ryan\OneDrive\Desktop, groups files, delete buttons
#
# Compile:  em compile summarizer.em
# Run:      node summarizer.js

star port is 3001
rain groups is void

# ── HTTP Server ──

serve port port
  route get "/api/groups"
    spawn "node /e/summarizer/scanner.js" into groups
    reply groups
  end

  route get "/api/health"
    spawn "node -e console.log(JSON.stringify({ok:true,version:'1.0'}))" into health
    reply health
  end

  route post "/api/delete"
    reply { ok: true, message: "use start.js wrapper for file operations" }
  end

  route post "/api/delete-group"
    reply { ok: true, message: "use start.js wrapper for file operations" }
  end
end