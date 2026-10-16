// Logs a step mark with a timestamp so the recording can be cut later.
// Usage: node demo/mark.mjs "<step id>" "<label>"   -> appends to demo/marks.log (ignored by git)
import { appendFileSync } from "node:fs";
const [id = "?", ...rest] = process.argv.slice(2);
const line = JSON.stringify({ at: new Date().toISOString(), id, label: rest.join(" ") });
appendFileSync(new URL("./marks.log", import.meta.url), line + "\n");
console.log(`mark ${id} ${rest.join(" ")}`);
