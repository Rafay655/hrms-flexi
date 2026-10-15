
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const ROOTS = ["services", "lib/api", "app"];
const EXTS = new Set([".ts", ".tsx"]);
const FORBIDDEN = [/^\/?v1\//, /^\/?v1$/, /^\/?api\//, /^\/?api$/];


const CALL =
  /\bapi\s*\.\s*(get|post|put|delete|patch)\s*(?:<[^>]*>)?\s*\(\s*[`'"]([^`'"]+)/g;

function walk(dir) {
  let out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out; 
  }
  for (const name of entries) {
    if (name === "node_modules" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(walk(full));
    else if (EXTS.has(extname(name))) out.push(full);
  }
  return out;
}

const violations = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const text = readFileSync(file, "utf8");
    CALL.lastIndex = 0;
    let m;
    while ((m = CALL.exec(text)) !== null) {
      const path = m[2];
      if (FORBIDDEN.some((re) => re.test(path))) {
        const line = text.slice(0, m.index).split("\n").length;
        violations.push(`${file}:${line}  api.${m[1]}("${path}…")`);
      }
    }
  }
}

if (violations.length > 0) {
  console.error(
    "✖ Forbidden API path prefix (/v1 or api/). NEXT_PUBLIC_API_URL already includes /api/v1:",
  );
  for (const v of violations) console.error("  " + v);
  console.error(
    `\n${violations.length} violation(s). Use a module-relative path, e.g. "/system-flex/...".`,
  );
  process.exit(1);
}

console.log("✓ No forbidden /v1 or api/ prefixes in frontend API-client paths.");
