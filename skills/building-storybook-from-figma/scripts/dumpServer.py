# Tiny local receiver for the Figma plugin (127.0.0.1 only).
#   POST /save?name=x.json   writes the body to <dir>/x.json   (big reads skip the chat)
#   GET  /script?name=x.js   serves scripts/figma/plugin/x.js  (plugin scripts skip the chat)
#   GET  /ping               {"dir": "<absolute dir>"}          (shows where data lands)
# Usage: python3 scripts/figma/dumpServer.py <port> <dir>
import http.server, json, os, sys, urllib.parse
PORT = int(sys.argv[1])
OUT = os.path.abspath(sys.argv[2])
PLUGIN = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plugin")
def arg(path, key):
    return os.path.basename(urllib.parse.parse_qs(urllib.parse.urlparse(path).query).get(key, [""])[0])
class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
    def reply(self, code, body=b"", ctype="application/json"):
        self.send_response(code); self.cors(); self.send_header("Content-Type", ctype); self.end_headers(); self.wfile.write(body)
    def do_OPTIONS(self):
        self.reply(204)
    def do_POST(self):
        name = arg(self.path, "name") or "dump.json"
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, name), "wb") as f: f.write(body)
        self.reply(200, b'{"saved":%d}' % len(body))
    def do_GET(self):
        route = urllib.parse.urlparse(self.path).path
        if route == "/ping":
            return self.reply(200, json.dumps({"dir": OUT}).encode())
        if route == "/script":
            f = os.path.join(PLUGIN, arg(self.path, "name"))
            if os.path.isfile(f):
                return self.reply(200, open(f, "rb").read(), "text/javascript")
        self.reply(404)
    def log_message(self, *a): pass
try:
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), H)
except OSError as e:
    sys.exit(f"dumpServer: port {PORT} is already in use ({e}). Stop the old receiver first: kill $(lsof -ti :{PORT})")
print(f"dumpServer: listening on 127.0.0.1:{PORT}, writing to {OUT}", flush=True)
server.serve_forever()
