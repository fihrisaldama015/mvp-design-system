# Tiny local receiver: the Figma plugin POSTs JSON here, we write it to disk.
# Lets big reads skip the chat context. Only listens on 127.0.0.1.
import http.server, os, sys, urllib.parse
OUT = sys.argv[2]
class H(http.server.BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.end_headers()
    def do_POST(self):
        name = os.path.basename(urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query).get("name", ["dump.json"])[0])
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        os.makedirs(OUT, exist_ok=True)
        with open(os.path.join(OUT, name), "wb") as f: f.write(body)
        self.send_response(200); self.cors(); self.end_headers(); self.wfile.write(b'{"saved":%d}' % len(body))
    def do_GET(self):
        self.send_response(404); self.end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(("127.0.0.1", int(sys.argv[1])), H).serve_forever()
