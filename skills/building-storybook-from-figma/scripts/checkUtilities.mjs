// Check that Tailwind classes exist with the token config, and print their CSS.
// Usage: node scripts/figma/checkUtilities.mjs "bg-primary-default text-body rounded-default ..."
import postcss from "postcss";
import tailwind from "tailwindcss";
import config from "../../tailwind.config.js";

const classes = (process.argv[2] || "").split(/\s+/).filter(Boolean);
const res = await postcss([tailwind({ ...config, content: [{ raw: classes.join(" ") }] })]).process("@tailwind components; @tailwind utilities;", { from: undefined });
let missing = 0;
for (const cls of classes) {
  const esc = cls.replace(/[./:]/g, (c) => "\\\\" + c);
  const m = res.css.match(new RegExp("\\." + esc + "(?![-\\w])[^{,]*\\{([^}]*)\\}"));
  if (!m) missing++;
  console.log((m ? "ok   " : "MISS ") + cls.padEnd(26) + (m ? m[1].replace(/\s+/g, " ").trim().slice(0, 120) : ""));
}
process.exit(missing ? 1 : 0);
