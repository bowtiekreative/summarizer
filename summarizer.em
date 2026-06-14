# Summarizer — EventMath Desktop File Organizer
# The EventMath server handles ALL API operations.
# A static file server proxies API calls here.

star api port is 3001

# ── API Routes ──

serve port api port
  route get "/api/groups"
    spawn "node /e/summarizer/scanner.js" into groups
    reply groups
  end

  route get "/api/health"
    spawn "node -e console.log(JSON.stringify({running:true,version:'1.0'}))" into info
    reply info
  end
end