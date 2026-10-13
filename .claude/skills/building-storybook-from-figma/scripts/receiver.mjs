// Starts dumpServer.py with whichever Python 3 command this machine has (python3, python or py).
// Usage: node scripts/figma/receiver.mjs [port] [dir]     (defaults: 9232 .figma-dump)
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [port = "9232", dir = ".figma-dump"] = process.argv.slice(2);
const py = ["python3", "python", "py"].find((c) => spawnSync(c, ["--version"], { encoding: "utf8", shell: process.platform === "win32" }).stdout?.startsWith("Python 3"));
if (!py) {
  console.error("receiver: Python 3 not found. Run: node scripts/figma/doctor.mjs (it shows the install command for this OS).");
  process.exit(1);
}
const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "dumpServer.py");
spawn(py, [script, port, dir], { stdio: "inherit", shell: false }).on("exit", (c) => process.exit(c ?? 0));
