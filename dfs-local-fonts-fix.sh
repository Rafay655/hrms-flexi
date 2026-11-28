#!/usr/bin/env bash
set -euo pipefail

[[ -f app/layout.tsx && -f package.json ]] || { echo 'Run from the hrms-flexi root.' >&2; exit 1; }

layout=app/layout.tsx
font_dir=app/fonts/dfs
tmp=$(mktemp -d './.dfs-font-fix.XXXXXX')
cleanup() {
  rm -f -- "$tmp/layout.tsx" "$tmp/LeagueSpartan-variable.ttf" "$tmp/Poppins-Regular.ttf" \
    "$tmp/Poppins-Medium.ttf" "$tmp/Poppins-SemiBold.ttf" "$tmp/LeagueSpartan-OFL.txt" "$tmp/Poppins-OFL.txt"
  rmdir -- "$tmp"
}
trap cleanup EXIT

node - "$layout" "$tmp/layout.tsx" <<'NODE'
const fs = require("node:fs");
const [source, destination] = process.argv.slice(2);
const original = fs.readFileSync(source, "utf8");
const eol = original.includes("\r\n") ? "\r\n" : "\n";
let layout = original.replace(/\r\n/g, "\n");

const edits = [
  [
    'import { League_Spartan, Poppins } from "next/font/google";',
    'import localFont from "next/font/local";',
  ],
  [
    ['const leagueSpartan = League_Spartan({',
     '  subsets: ["latin"],',
     '  weight: ["400", "500", "600", "700"],'].join("\n"),
    ['const leagueSpartan = localFont({',
     '  src: "./fonts/dfs/LeagueSpartan-variable.ttf",',
     '  weight: "400 700",'].join("\n"),
  ],
  [
    ['const poppins = Poppins({',
     '  subsets: ["latin"],',
     '  weight: ["400", "500", "600"],'].join("\n"),
    ['const poppins = localFont({',
     '  src: [',
     '    { path: "./fonts/dfs/Poppins-Regular.ttf", weight: "400" },',
     '    { path: "./fonts/dfs/Poppins-Medium.ttf", weight: "500" },',
     '    { path: "./fonts/dfs/Poppins-SemiBold.ttf", weight: "600" },',
     '  ],'].join("\n"),
  ],
];

const alreadyPatched = edits.every(([, after]) => layout.includes(after));
if (!alreadyPatched) {
  for (const [before, after] of edits) {
    if (layout.split(before).length !== 2) {
      throw new Error("The layout differs from the supplied DFS file. No changes applied.");
    }
    layout = layout.replace(before, after);
  }
}
fs.writeFileSync(destination, layout.replace(/\n/g, eol));
NODE

upstream=https://raw.githubusercontent.com/google/fonts/main/ofl
fetch() {
  curl --fail --silent --show-error --location --retry 2 --max-time 30 "$upstream/$1" --output "$tmp/$2"
}

fetch 'leaguespartan/LeagueSpartan%5Bwght%5D.ttf' 'LeagueSpartan-variable.ttf'
fetch 'leaguespartan/OFL.txt' 'LeagueSpartan-OFL.txt'
for variant in Regular Medium SemiBold; do
  fetch "poppins/Poppins-$variant.ttf" "Poppins-$variant.ttf"
done
fetch 'poppins/OFL.txt' 'Poppins-OFL.txt'

node - "$tmp" <<'NODE'
const fs = require("node:fs");
const path = require("node:path");
const folder = process.argv[2];
for (const name of ["LeagueSpartan-variable.ttf", "Poppins-Regular.ttf", "Poppins-Medium.ttf", "Poppins-SemiBold.ttf"]) {
  const font = fs.readFileSync(path.join(folder, name));
  if (font.length < 1000 || font.readUInt32BE(0) !== 0x00010000 || (name.startsWith("League") && !font.includes("fvar"))) {
    throw new Error("Invalid downloaded font " + name);
  }
}
for (const name of ["LeagueSpartan-OFL.txt", "Poppins-OFL.txt"]) {
  if (!fs.readFileSync(path.join(folder, name), "utf8").includes("SIL OPEN FONT LICENSE")) {
    throw new Error("Invalid font license " + name);
  }
}
NODE

mkdir -p -- "$font_dir"
install -m 0644 -- "$tmp/"*.ttf "$tmp/"*-OFL.txt "$font_dir/"
if ! cmp -s "$layout" "$tmp/layout.tsx"; then
  cat "$tmp/layout.tsx" > "$layout"
fi

echo 'League Spartan and Poppins now use local fonts. Run npm run build.'
